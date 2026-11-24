# OKYCT for Rust

`okyct` is the zero-dependency Rust implementation of the OKYCT perceptual color engine and MD3 dynamic theme system for emissive displays.

```rust
use okyct::{
    CreateThemeOptions, CssColorFormat, EmissivePanelType, EmissiveSchemeOptions,
    ExportThemeOptions, GamutTarget, StateLayersOption, ThemeMode, TokenExportFormat,
    create_theme,
};

let mut opts = CreateThemeOptions::new("#2563eb");
opts.gamut = GamutTarget::DisplayP3;
opts.emissive = EmissiveSchemeOptions {
    profile: EmissivePanelType::AmoledAntiSmear,
    ..Default::default()
};
opts.state_layers = StateLayersOption::All;

let theme = create_theme(&opts).unwrap();
let primary = theme.scheme(ThemeMode::Dark).get(okyct::SystemColorToken::Primary);
let css = theme
    .export(&ExportThemeOptions {
        format: TokenExportFormat::Css,
        color_format: CssColorFormat::DisplayP3,
        ..Default::default()
    })
    .unwrap();
```

## Architecture

- `domain`: Pure colorimetric math, gamut mapping, WCAG/APCA contrast solvers, CVD simulation, and mathematical invariant suite.
- `ports`: Inbound and outbound contract traits and value types.
- `application`: `TonalPalette`, `create_palettes_from_source`, `build_dynamic_scheme_with_physics`, `resolve_custom_colors`, layer stacking, and contrast/CVD audits.
- `adapters`: `create_theme` / `OkyctTheme`, emissive OLED physics, multi-format exporters (`css`, `tailwind`, `w3c`, `ts`), image quantizer, and FP token operators.
- `architecture_guard`: Hexagonal layer dependency boundary verifier.

Run `cargo test --manifest-path packages/rust/Cargo.toml --offline` to execute the unit, architecture, and cross-language TypeScript parity test suites.
