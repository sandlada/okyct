use crate::application::TonalPalette;
use crate::domain::models::{CssColorFormat, OkyctError};
use crate::ports::inbound::{
    DynamicSchemeColors, PaletteSet, ResolvedCustomColor, StateLayersOption, TonalPalettePort,
};
use crate::ports::outbound::{
    CssSchemeMode, ExportCssVariablesOptions, ExportTailwindV4Options, ExportTokensBaseOptions,
    TailwindFallbackMode, TokenExportFormat,
};
use super::export_css_variables::export_css_variables;
use super::export_tailwind_v4::export_tailwind_v4;
use super::export_typescript_tokens::export_typescript_tokens;
use super::export_w3c_design_tokens::export_w3c_design_tokens;

#[derive(Debug, Clone)]
pub struct ExportThemeInput<'a, P: TonalPalettePort = TonalPalette> {
    pub light_scheme: &'a DynamicSchemeColors,
    pub dark_scheme: &'a DynamicSchemeColors,
    pub palettes: Option<&'a PaletteSet<P>>,
    pub custom_colors_light: &'a [ResolvedCustomColor],
    pub custom_colors_dark: &'a [ResolvedCustomColor],
}

#[derive(Debug, Clone, PartialEq, Default)]
pub struct ExportThemeOptions {
    pub format: TokenExportFormat,
    pub css_scheme_mode: CssSchemeMode,
    pub tailwind_fallback: TailwindFallbackMode,
    pub state_layers: Option<StateLayersOption>,
    pub color_format: CssColorFormat,
}

pub fn export_theme<P: TonalPalettePort + Clone>(
    input: &ExportThemeInput<'_, P>,
    options: &ExportThemeOptions,
) -> Result<String, OkyctError> {
    let base = ExportTokensBaseOptions {
        custom_colors_light: input.custom_colors_light.to_vec(),
        custom_colors_dark: input.custom_colors_dark.to_vec(),
        state_layers: options.state_layers.clone(),
        color_format: options.color_format,
    };

    match options.format {
        TokenExportFormat::Css => export_css_variables(
            input.light_scheme,
            input.dark_scheme,
            &ExportCssVariablesOptions {
                base,
                palettes: input.palettes.cloned(),
                scheme_mode: options.css_scheme_mode,
            },
        ),
        TokenExportFormat::Tailwind => export_tailwind_v4(
            input.light_scheme,
            input.dark_scheme,
            &ExportTailwindV4Options {
                base,
                fallback: options.tailwind_fallback,
            },
        ),
        TokenExportFormat::W3c => {
            export_w3c_design_tokens(input.light_scheme, input.dark_scheme, &base)
        }
        TokenExportFormat::Ts => {
            export_typescript_tokens(input.light_scheme, input.dark_scheme, &base)
        }
    }
}
