using System.Collections.ObjectModel;
using System.Globalization;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using Sandlada.Okyct.Ports.Outbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Application;

public static partial class DynamicSchemes
{
    public static DynamicSchemeColors BuildDynamicSchemeWithPhysics<T>(
        PaletteSet<T> palettes, BuildDynamicSchemeOptions? options = null, IDisplayPhysicsPort? physics = null)
        where T : ITonalPalettePort
    {
        ArgumentNullException.ThrowIfNull(palettes);
        options ??= new();
        var emissive = options.Emissive ?? new EmissiveSchemeOptions();
        if (!Enum.IsDefined(options.Mode) || !double.IsFinite(options.ContrastLevel) ||
            !Enum.IsDefined(options.ContrastMetric) || !Enum.IsDefined(options.Ambient) ||
            !Enum.IsDefined(emissive.Profile))
            throw new ArgumentOutOfRangeException(nameof(options));

        PaletteSet<ITonalPalettePort> roles = new(palettes.Primary, palettes.Secondary, palettes.Tertiary,
            palettes.Neutral, palettes.NeutralVariant, palettes.Error, palettes.Warning, palettes.Success, palettes.Info);
        var dark = options.Mode == ThemeMode.Dark;
        var isXr = emissive.Profile == EmissivePanelType.MicroOledXr;
        var isAmoled = emissive.Profile == EmissivePanelType.AmoledAntiSmear;
        var bright = options.Ambient == AmbientSurround.Bright;
        var darkroom = options.Ambient == AmbientSurround.Darkroom;
        var contrast = Math.Clamp(options.ContrastLevel, -1, 1);
        if (bright) contrast = Math.Min(1, contrast + 0.35);

        var panel = physics?.GetPanelSpec(emissive.Profile) ?? EmissivePanelSpecs.Default[emissive.Profile];
        var peakCap = Math.Min(panel.LightPeakToneCap, darkroom ? 90 : 100);
        var foregroundCap = emissive.AntiFringing && isXr ? Math.Min(peakCap, 92) :
            emissive.AntiFringing && isAmoled ? Math.Min(peakCap, 97) : peakCap;
        if (darkroom) foregroundCap = Math.Min(foregroundCap, 88);

        var floorLift = bright ? 2 : 0;
        var lightSurfaceCap = Math.Min(darkroom ? 90 : 98, isXr ? 94 : 98);
        var targetTextRatio = contrast >= 0.8 ? 7.0 : contrast >= 0.35 ? 5.8 : 4.5;
        var targetTextApca = contrast >= 0.8 ? 75 : contrast >= 0.35 ? 65 : 60;
        var targetOutlineRatio = contrast >= 0.5 ? 4.5 : 3.0;
        var targetOutlineApca = contrast >= 0.5 ? 60 : 45;

        double AdjustTone(double tone, bool lighten, int delta)
        {
            if (contrast == 0) return tone;
            var factor = contrast > 0 ? contrast : contrast * 0.5;
            return lighten
                ? Math.Min(peakCap, RoundToInteger(tone + delta * factor))
                : Math.Max(0, RoundToInteger(tone - delta * factor));
        }

        var tones = ResolveTones(dark, isXr, peakCap, foregroundCap, lightSurfaceCap, floorLift,
            panel.DarkSurfaceTones, AdjustTone);
        if (emissive.AblGuard && !dark) ApplyAblGuard(tones);

        string ResolveHex(Role role, double tone)
        {
            if (tone <= 0) return "#000000";
            var hex = role.Palette(roles).Tone(tone);
            if (physics is null) return hex;
            if (emissive.BurnInGuard && role.Kind != SchemeRoleKind.Surface)
                hex = physics.ApplyBlueBurnInGuard(hex);
            if (emissive.AntiFringing)
                hex = physics.ApplySubpixelEdgeCompensation(hex, emissive.Profile, role.Kind);
            return hex;
        }

        var colors = SystemColorTokens.Values.ToDictionary(token => token, token => ResolveHex(Roles[token], tones[token]),
            StringComparer.Ordinal);
        foreach (var pair in Pairs)
        {
            var ratio = pair.IsOutline ? targetOutlineRatio : targetTextRatio;
            var apca = pair.IsOutline ? targetOutlineApca : targetTextApca;
            var fgHex = colors[pair.Foreground];
            var bgHex = colors[pair.Background];
            bool Passes(string fg, string bg) => MeetsContrast(fg, bg, ratio, apca, options.ContrastMetric);
            ContrastSolution Solve(double tone) => SolveTonesForContrast(tone, ratio, new(options.ContrastMetric, apca));

            if (Passes(fgHex, bgHex)) continue;
            var fgRole = Roles[pair.Foreground];
            var bgRole = Roles[pair.Background];
            var fgTone = HexToOkyct(fgHex).T;
            var bgTone = HexToOkyct(bgHex).T;
            var lightForeground = fgTone >= bgTone;
            var fgLimit = lightForeground ? (fgRole.Kind == SchemeRoleKind.Foreground ? foregroundCap : peakCap) : 0;
            var solved = Solve(bgTone);
            var fgStart = lightForeground ? Math.Min(solved.LightForegroundTone ?? fgLimit, fgLimit)
                : solved.DarkForegroundTone ?? 0;
            var adjusted = Refine(fgStart, fgLimit, t => ResolveHex(fgRole, t), hex => Passes(hex, bgHex));
            colors[pair.Foreground] = adjusted.Hex;
            if (adjusted.Passed) continue;

            var solvedBackground = Solve(HexToOkyct(adjusted.Hex).T);
            if (lightForeground)
            {
                var floor = dark && bgRole.Kind == SchemeRoleKind.Surface ? panel.DarkSurfaceTones.Surface + floorLift : 0;
                var start = Math.Max(floor, solvedBackground.DarkForegroundTone ?? floor);
                var refined = Refine(start, floor, t => ResolveHex(bgRole, t), hex => Passes(adjusted.Hex, hex));
                colors[pair.Background] = refined.Hex;
            }
            else if (solvedBackground.LightForegroundTone is double start && start <= peakCap)
            {
                var refined = Refine(start, peakCap, t => ResolveHex(bgRole, t), hex => Passes(adjusted.Hex, hex));
                colors[pair.Background] = refined.Hex;
            }
        }

        var coordinates = new Dictionary<string, OkyctColor>(StringComparer.Ordinal);
        foreach (var token in SystemColorTokens.Values)
        {
            var measured = HexToOkyct(colors[token]);
            tones[token] = double.Parse(ToFixed(measured.T, 2), CultureInfo.InvariantCulture);
            var role = Roles[token];
            var palette = role.Palette(roles);
            var target = palette.ToneOkyct(measured.T, palette.Gamut);
            if (physics is not null && (emissive.BurnInGuard || emissive.AntiFringing) &&
                (role.Kind != SchemeRoleKind.Surface || emissive.AntiFringing))
            {
                if (palette.Gamut == GamutTarget.Srgb)
                {
                    coordinates[token] = measured;
                }
                else
                {
                    var unguarded = palette.ToneOkyct(measured.T, GamutTarget.Srgb);
                    if (unguarded.C > 1e-4)
                    {
                        var shift = ((measured.H - unguarded.H + 540) % 360) - 180;
                        coordinates[token] = new((target.H + shift + 360) % 360,
                            target.C * Math.Min(1, measured.C / unguarded.C), measured.T);
                    }
                    else
                    {
                        coordinates[token] = measured;
                    }
                }
            }
            else
            {
                coordinates[token] = target with { T = measured.T };
            }
        }

        var scheme = new DynamicSchemeColors(new ReadOnlyDictionary<string, string>(colors),
            new ReadOnlyDictionary<string, double>(tones), new ReadOnlyDictionary<string, OkyctColor>(coordinates));
        if (options.StateLayers is not { Count: > 0 } states) return scheme;
        var stateLayers = ResolveSchemeStateLayers(scheme, states, options.StateLayersBlendSpace, options.StateLayersContrastGuard);
        foreach (var (key, hex) in stateLayers) colors.Add(key, hex);
        return scheme with { StateLayers = stateLayers };
    }

    public static IReadOnlyDictionary<string, string> ResolveSchemeStateLayers(DynamicSchemeColors scheme,
        IReadOnlyList<StateLayer>? states = null, BlendSpace blendSpace = BlendSpace.Okyct, bool contrastGuard = false)
    {
        ArgumentNullException.ThrowIfNull(scheme);
        var requested = states?.Distinct().ToArray() ?? [];
        if (requested.Any(state => state is < StateLayer.Hovered or > StateLayer.Dragged))
            throw new ArgumentOutOfRangeException(nameof(states));
        var result = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var token in SystemColorTokens.StatefulValues)
        {
            foreach (var state in requested)
            {
                result[token + state] = CompositeGuardedStateHex(scheme[token], scheme[Roles[token].Overlay!],
                    state, blendSpace, contrastGuard);
            }
        }
        return new ReadOnlyDictionary<string, string>(result);
    }

    internal static string CompositeGuardedStateHex(string background, string foreground, StateLayer state,
        BlendSpace space, bool guard)
    {
        var opacity = state switch
        {
            StateLayer.Hovered => 0.08,
            StateLayer.Focused or StateLayer.Pressed => 0.12,
            StateLayer.Dragged => 0.16,
            _ => throw new ArgumentOutOfRangeException(nameof(state))
        };
        string Composite(double alpha) => LayerStacking.StackLayers(new StackOptions(space))
            ([new ColorLayer(foreground, alpha)])(background).FinalHex;
        var nominal = Composite(opacity);
        if (!guard || GetContrastRatio(background, foreground) < 4.5 || GetContrastRatio(nominal, foreground) >= 4.5)
            return nominal;

        var low = 0.0;
        var high = opacity;
        var best = background;
        for (var i = 0; i < 8; i++)
        {
            var middle = (low + high) * 0.5;
            var candidate = Composite(middle);
            if (GetContrastRatio(candidate, foreground) >= 4.5)
            {
                best = candidate;
                low = middle;
            }
            else
            {
                high = middle;
            }
        }
        return best;
    }

    internal static bool MeetsContrast(string foreground, string background, double ratio, double lc, ContrastMetric metric) =>
        (metric == ContrastMetric.Apca || GetContrastRatio(foreground, background) >= ratio) &&
        (metric == ContrastMetric.Wcag || Math.Abs(GetApcaContrast(foreground, background)) >= lc);

    internal static (string Hex, bool Passed) Refine(double start, double limit, Func<double, string> resolve,
        Func<string, bool> passes)
    {
        var first = resolve(start);
        if (passes(first)) return (first, true);
        if (start == limit) return (first, false);
        var best = resolve(limit);
        if (!passes(best)) return (best, false);

        for (var i = 0; i < 12 && Math.Abs(limit - start) > 0.05; i++)
        {
            var middle = (start + limit) * 0.5;
            var current = resolve(middle);
            if (passes(current))
            {
                limit = middle;
                best = current;
            }
            else
            {
                start = middle;
            }
        }
        return (best, true);
    }

    private static void ApplyAblGuard(Dictionary<string, double> tones)
    {
        double Y(string token) => ToneToY(tones[token]);
        var apl = (Y("surface") * 0.42 + Y("surfaceContainerLowest") * 0.14 + Y("surfaceContainerLow") * 0.12 +
            Y("surfaceContainer") * 0.12 + Y("surfaceContainerHigh") * 0.06 + Y("primary") * 0.05 +
            Y("primaryContainer") * 0.04 + Y("secondaryContainer") * 0.02 +
            Y("onSurface") * 0.02 + Y("onSurfaceVariant") * 0.01) * 100;
        if (apl <= 65) return;

        (string Token, double Cap)[] caps = [
            ("surface", 84), ("surfaceBright", 86), ("surfaceContainerLowest", 86), ("surfaceContainerLow", 83),
            ("surfaceContainer", 81), ("surfaceContainerHigh", 79), ("surfaceContainerHighest", 77),
            ("surfaceDim", 75), ("surfaceVariant", 79), ("primaryContainer", 82),
            ("secondaryContainer", 82), ("tertiaryContainer", 82)];
        foreach (var (token, cap) in caps) tones[token] = Math.Min(tones[token], cap);
    }
}
