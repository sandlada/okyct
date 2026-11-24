# OKYCT for .NET

`Sandlada.Okyct` is the .NET 10 implementation of the OKYCT color engine. The class library uses the .NET standard library. The test project uses TypeScript-generated fixtures to check behavior across both implementations.

```csharp
using Sandlada.Okyct.Adapters;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using Sandlada.Okyct.Ports.Outbound;

var theme = ThemeFactory.CreateTheme(new CreateThemeOptions(
    "#2563eb",
    Gamut: GamutTarget.DisplayP3,
    Emissive: new EmissiveSchemeOptions(EmissivePanelType.AmoledAntiSmear),
    StateLayers: StateLayers.All));

var primary = theme.Scheme(ThemeMode.Dark)["primary"];
var css = theme.Export(TokenExportFormat.Css,
    new ExportThemeOptions(ColorFormat: CssColorFormat.DisplayP3));
```

| TypeScript entry | C# entry |
| --- | --- |
| Color conversion, gamut, contrast, CVD and self-checks | `Domain.Models` and `Domain.Services.ColorScience` |
| Inbound and outbound contracts | `Ports.Inbound` and `Ports.Outbound` |
| Palettes, schemes, custom colors, layer compositing and audits | `Application.TonalPalette`, `Palettes`, `DynamicSchemes`, `CustomColors` and `LayerStacking` |
| Themes, emissive physics, exports, quantization and token operators | `Adapters.ThemeFactory`, `OkyctTheme`, `DisplayPhysics`, `TokenExporter`, `ImageQuantizer` and `TokenOperators` |
| Architecture guard | `ArchitectureGuard.VerifyHexagonalArchitectureBoundaries` |

The default state-layer selection is disabled when building themes. Use `StateLayers.All` or pass a list of states. When exporting, an omitted selection uses the theme’s existing states and an empty list suppresses them. Supported export formats are CSS variables, Tailwind v4, W3C Design Tokens and TypeScript tokens.

Run `pnpm build:csharp` and `pnpm test:csharp` from the repository root. The TUnit suite checks the TypeScript fixtures, five colorimetric invariants and C# layer dependencies. Regenerate fixtures after a deliberate TypeScript baseline change with `node packages/csharp/generate-color-fixtures.mjs`.
