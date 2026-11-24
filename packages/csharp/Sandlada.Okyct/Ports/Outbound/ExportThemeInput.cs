using Sandlada.Okyct.Ports.Inbound;

namespace Sandlada.Okyct.Ports.Outbound;

public sealed record ExportThemeInput(
    DynamicSchemeColors LightScheme, DynamicSchemeColors DarkScheme,
    PaletteSet<ITonalPalettePort>? Palettes = null, string? SourceHex = null,
    PaletteVariant Variant = PaletteVariant.TonalSpot, bool HarmonizeSemantics = true,
    IReadOnlyList<ResolvedCustomColor>? CustomColorsLight = null,
    IReadOnlyList<ResolvedCustomColor>? CustomColorsDark = null);
