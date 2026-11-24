use crate::domain::models::{CssColorFormat, OkyctError};
use super::super::inbound::palette_generation::{PaletteSet, TonalPalettePort};
use super::super::inbound::scheme_building::{
    DynamicSchemeColors, ResolvedCustomColor, StateLayersOption,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum CssSchemeMode {
    #[default]
    LightDark,
    Class,
}

impl CssSchemeMode {
    pub const ALL: [Self; 2] = [Self::Class, Self::LightDark];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Class => "class",
            Self::LightDark => "light-dark",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum TailwindFallbackMode {
    None,
    #[default]
    LightDark,
}

impl TailwindFallbackMode {
    pub const ALL: [Self; 2] = [Self::None, Self::LightDark];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::LightDark => "light-dark",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Default)]
pub struct ExportTokensBaseOptions {
    pub custom_colors_light: Vec<ResolvedCustomColor>,
    pub custom_colors_dark: Vec<ResolvedCustomColor>,
    pub state_layers: Option<StateLayersOption>,
    pub color_format: CssColorFormat,
}

#[derive(Debug, Clone, Default)]
pub struct ExportCssVariablesOptions<P> {
    pub base: ExportTokensBaseOptions,
    pub palettes: Option<PaletteSet<P>>,
    pub scheme_mode: CssSchemeMode,
}

#[derive(Debug, Clone, PartialEq, Default)]
pub struct ExportTailwindV4Options {
    pub base: ExportTokensBaseOptions,
    pub fallback: TailwindFallbackMode,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum TokenExportFormat {
    #[default]
    Css,
    Tailwind,
    W3c,
    Ts,
}

impl TokenExportFormat {
    pub const ALL: [Self; 4] = [Self::Css, Self::Tailwind, Self::W3c, Self::Ts];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Css => "css",
            Self::Tailwind => "tailwind",
            Self::W3c => "w3c",
            Self::Ts => "ts",
        }
    }
}

pub trait TokenExporterPort<P: TonalPalettePort> {
    fn export_css_variables(
        &self,
        light_scheme: &DynamicSchemeColors,
        dark_scheme: &DynamicSchemeColors,
        options: &ExportCssVariablesOptions<P>,
    ) -> Result<String, OkyctError>;

    fn export_tailwind_v4(
        &self,
        light_scheme: &DynamicSchemeColors,
        dark_scheme: &DynamicSchemeColors,
        options: &ExportTailwindV4Options,
    ) -> Result<String, OkyctError>;

    fn export_w3c_design_tokens(
        &self,
        light_scheme: &DynamicSchemeColors,
        dark_scheme: &DynamicSchemeColors,
        options: &ExportTokensBaseOptions,
    ) -> Result<String, OkyctError>;

    fn export_typescript_tokens(
        &self,
        light_scheme: &DynamicSchemeColors,
        dark_scheme: &DynamicSchemeColors,
        options: &ExportTokensBaseOptions,
    ) -> Result<String, OkyctError>;
}
