using System.Collections.ObjectModel;
using System.Globalization;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Application;

public static class CustomColors
{
    public static IReadOnlyList<ResolvedCustomColor> ResolveCustomColors(
        IReadOnlyList<CustomColorInput> configs, string primarySeedHex, ResolveCustomColorsOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(configs);
        options ??= new();
        if (!Enum.IsDefined(options.Mode) || !double.IsFinite(options.ContrastLevel) ||
            !Enum.IsDefined(options.ContrastMetric))
            throw new ArgumentOutOfRangeException(nameof(options));

        var dark = options.Mode == ThemeMode.Dark;
        var contrast = Math.Clamp(options.ContrastLevel, -1, 1);
        var minRatio = contrast >= 0.8 ? 7.0 : contrast >= 0.35 ? 5.8 : 4.5;
        var minApca = contrast >= 0.8 ? 75 : contrast >= 0.35 ? 65 : 60;
        var states = options.StateLayers?.Distinct().Order().ToArray() ?? [];
        if (states.Any(state => state is < StateLayer.Hovered or > StateLayer.Dragged))
            throw new ArgumentOutOfRangeException(nameof(options));

        var results = new List<ResolvedCustomColor>(configs.Count);
        foreach (var config in configs)
        {
            ArgumentNullException.ThrowIfNull(config);
            var name = config.Name is not null ? TrimAsciiWhitespace(config.Name) : "";
            if (!name.Any(character => character is not ('-' or '_') && !IsAsciiWhitespace(character)))
                throw new ArgumentException("Expected a non-empty color identifier.", nameof(configs));
            var id = config.Id is not null ? TrimAsciiWhitespace(config.Id) : name;
            var label = config.Label is not null ? TrimAsciiWhitespace(config.Label) : name;
            if (id.Length == 0 || label.Length == 0)
                throw new ArgumentException("Expected a non-empty color ID and label.", nameof(configs));

            var original = HexToOkyct(config.SourceHex);
            var effective = config.Harmonize ? Palettes.HarmonizeHex(config.SourceHex, primarySeedHex) : config.SourceHex;
            var hueShift = ShortestHueDelta(HexToOkyct(effective).H, original.H);
            var palette = TonalPalette.FromHex(effective);
            var color = palette.Tone(dark ? (contrast > 0.3 ? 86 : 80) : (contrast > 0.3 ? 32 : 40));
            var container = palette.Tone(dark ? 30 : 90);

            string ResolveForeground(double initial, string bg, bool light)
            {
                bool Passes(string fg) => DynamicSchemes.MeetsContrast(fg, bg, minRatio, minApca, options.ContrastMetric);
                var hex = palette.Tone(initial);
                if (Passes(hex)) return hex;
                var solution = SolveTonesForContrast(bg, minRatio, new ContrastSolveOptions(options.ContrastMetric, minApca));
                var tone = light ? solution.LightForegroundTone ?? 100 : solution.DarkForegroundTone ?? 0;
                hex = palette.Tone(tone);
                for (var attempt = 0; attempt < 20 && !Passes(hex); attempt++)
                {
                    tone = light ? Math.Min(100, tone + 0.5) : Math.Max(0, tone - 0.5);
                    hex = palette.Tone(tone);
                    if (tone is <= 0 or >= 100) break;
                }
                return hex;
            }

            var onColor = ResolveForeground(dark ? 20 : 100, color, !dark);
            var onContainer = ResolveForeground(dark ? 90 : 10, container, dark);
            IReadOnlyDictionary<string, string>? overlays = null;
            if (states.Length > 0)
            {
                var map = new Dictionary<string, string>(StringComparer.Ordinal);
                foreach (var state in states)
                {
                    string Composite(string fg, string bg) => DynamicSchemes.CompositeGuardedStateHex(fg, bg,
                        state, options.StateLayersBlendSpace, options.StateLayersContrastGuard);
                    map.Add("color" + state, Composite(color, onColor));
                    map.Add("onColor" + state, Composite(onColor, color));
                    map.Add("colorContainer" + state, Composite(container, onContainer));
                    map.Add("onColorContainer" + state, Composite(onContainer, container));
                }
                overlays = new ReadOnlyDictionary<string, string>(map);
            }

            results.Add(new ResolvedCustomColor(id, name, label, config.SourceHex, effective, Fixed(hueShift, 1),
                color, onColor, container, onContainer, Fixed(GetContrastRatio(onColor, color), 2),
                Fixed(GetContrastRatio(onContainer, container), 2), Math.Abs(GetApcaContrast(onColor, color)),
                Math.Abs(GetApcaContrast(onContainer, container)), overlays));
        }
        return results.AsReadOnly();
    }

    private static double Fixed(double value, int digits) =>
        double.Parse(ToFixed(value, digits), CultureInfo.InvariantCulture);
}
