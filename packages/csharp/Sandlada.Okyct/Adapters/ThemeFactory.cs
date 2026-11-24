using Sandlada.Okyct.Application;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using Sandlada.Okyct.Ports.Outbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Adapters;

public static class ThemeFactory
{
    internal static DisplayPhysics Physics { get; } = new();

    public static OkyctTheme CreateTheme(string sourceHex) => CreateTheme(new CreateThemeOptions(sourceHex));

    public static OkyctTheme CreateTheme(CreateThemeOptions options, IReadOnlyDictionary<string, string> customColors)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(customColors);
        return CreateTheme(options with
        {
            CustomColors = customColors.Select(pair => new CustomColorInput(pair.Key, pair.Value)).ToArray()
        });
    }

    public static OkyctTheme CreateTheme(CreateThemeOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var source = HexToOkyct(options.SourceHex);
        if (!double.IsFinite(options.ContrastLevel)) throw new ArgumentOutOfRangeException(nameof(options));

        var contrast = Math.Clamp(options.ContrastLevel, -1, 1);
        var emissive = options.Emissive ?? new EmissiveSchemeOptions();
        var palettes = Palettes.CreatePalettesFromSource(options.SourceHex,
            new CreatePalettesOptions(options.Variant, options.HarmonizeSemantics, options.Gamut,
                options.HkCompensation, options.SoftKnee));

        DynamicSchemeColors Scheme(ThemeMode mode) => BuildDynamicScheme(palettes,
            new BuildDynamicSchemeOptions(mode, contrast, options.ContrastMetric, options.Ambient, emissive,
                options.StateLayers, options.StateLayersBlendSpace, options.StateLayersContrastGuard));

        IReadOnlyList<ResolvedCustomColor> Resolve(ThemeMode mode) => CustomColors.ResolveCustomColors(options.CustomColors ?? [],
            options.SourceHex, new ResolveCustomColorsOptions(mode, contrast, options.ContrastMetric,
                options.StateLayers, options.StateLayersBlendSpace, options.StateLayersContrastGuard));

        return new OkyctTheme(options.SourceHex, source, options.Variant, contrast, options.ContrastMetric, emissive,
            palettes, Scheme(ThemeMode.Light), Scheme(ThemeMode.Dark), Resolve(ThemeMode.Light), Resolve(ThemeMode.Dark));
    }

    public static DynamicSchemeColors BuildDynamicScheme<T>(
        PaletteSet<T> palettes, BuildDynamicSchemeOptions? options = null) where T : ITonalPalettePort =>
        DynamicSchemes.BuildDynamicSchemeWithPhysics(palettes, options, Physics);
}
