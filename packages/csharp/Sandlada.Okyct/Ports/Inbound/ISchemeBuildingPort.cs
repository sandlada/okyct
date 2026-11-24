namespace Sandlada.Okyct.Ports.Inbound;

public interface ISchemeBuildingPort<T> where T : ITonalPalettePort
{
    DynamicSchemeColors BuildDynamicScheme(PaletteSet<T> palettes, BuildDynamicSchemeOptions? options = null);
    IReadOnlyList<ResolvedCustomColor> ResolveCustomColors(IReadOnlyList<CustomColorInput> configs,
        string primarySeedHex, ResolveCustomColorsOptions? options = null);
    IReadOnlyList<ContrastAuditItem> AuditSchemeContrast(DynamicSchemeColors scheme);
}
