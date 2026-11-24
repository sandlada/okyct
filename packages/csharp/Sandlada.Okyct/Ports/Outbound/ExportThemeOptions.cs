using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;

namespace Sandlada.Okyct.Ports.Outbound;

public sealed record ExportThemeOptions(TokenExportFormat Format = TokenExportFormat.Css,
    CssSchemeMode CssSchemeMode = CssSchemeMode.LightDark, TailwindFallbackMode TailwindFallback = TailwindFallbackMode.LightDark,
    IReadOnlyList<StateLayer>? StateLayers = null, CssColorFormat ColorFormat = CssColorFormat.Hex);
