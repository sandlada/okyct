using Sandlada.Okyct.Application;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using Sandlada.Okyct.Ports.Outbound;

namespace Sandlada.Okyct.Adapters;

public sealed record OkyctTheme(
    string SourceHex, OkyctColor SourceOkyct, PaletteVariant Variant, double ContrastLevel, ContrastMetric ContrastMetric,
    EmissiveSchemeOptions Emissive, PaletteSet<TonalPalette> Palettes,
    DynamicSchemeColors LightScheme, DynamicSchemeColors DarkScheme,
    IReadOnlyList<ResolvedCustomColor> LightCustomColors, IReadOnlyList<ResolvedCustomColor> DarkCustomColors)
{
    public DynamicSchemeColors Scheme(ThemeMode mode = ThemeMode.Dark) => mode switch
    {
        ThemeMode.Light => LightScheme,
        ThemeMode.Dark => DarkScheme,
        _ => throw new ArgumentOutOfRangeException(nameof(mode))
    };

    public IReadOnlyList<ContrastAuditItem> AuditContrast(ThemeMode mode = ThemeMode.Dark) =>
        DynamicSchemes.AuditSchemeContrast(Scheme(mode));

    public Dictionary<string, string> Tokens(ThemeMode mode = ThemeMode.Dark, bool includeCustomColors = true,
        bool includeStateLayers = true) => TokenOperators.ToTokenDictionary(Scheme(mode),
            includeCustomColors ? (mode == ThemeMode.Dark ? DarkCustomColors : LightCustomColors) : [],
            includeStateLayers);

    public SchemeEmissiveReport AnalyzeEmissive(ThemeMode mode = ThemeMode.Dark) =>
        ThemeFactory.Physics.AnalyzeEmissiveSchemeMetrics(Scheme(mode), Emissive.Profile);

    public string Export(TokenExportFormat format = TokenExportFormat.Css, ExportThemeOptions? options = null) =>
        new TokenExporter().ExportTheme(this, (options ?? new ExportThemeOptions()) with { Format = format });
}
