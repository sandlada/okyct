use crate::domain::models::{Okyct, OkyctError};

#[derive(Debug, Clone, PartialEq)]
pub struct ColorLayer {
    pub color: String,
    pub opacity: f64,
    pub label: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LayerStepTrace {
    pub step_index: usize,
    pub label: String,
    pub layer_color: String,
    pub layer_opacity: f64,
    pub accumulated_hex: String,
    pub accumulated_okyct: Okyct,
    pub wcag_contrast_with_white: f64,
    pub wcag_contrast_with_black: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum BlendSpace {
    #[default]
    LinearSrgb,
    GammaSrgb,
    Okyct,
}

impl BlendSpace {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::LinearSrgb => "linear-srgb",
            Self::GammaSrgb => "gamma-srgb",
            Self::Okyct => "okyct",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct CompositedResult {
    pub base_color: String,
    pub total_layers: usize,
    pub final_hex: String,
    pub final_okyct: Okyct,
    pub traces: Vec<LayerStepTrace>,
    pub blend_space: BlendSpace,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct StackOptions {
    pub blend_space: BlendSpace,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StackedContrastReport {
    pub foreground_hex: String,
    pub final_background_hex: String,
    pub wcag_ratio: f64,
    pub wcag_pass_aa: bool,
    pub wcag_pass_aaa: bool,
    pub apca_lc: f64,
    pub delta_tone_from_base: f64,
    pub warning_message: Option<String>,
    pub recommended_compensation_tone: Option<f64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StackStateInput {
    Hovered,
    Focused,
    Pressed,
    Dragged,
    Hover,
    Focus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CssColorMixSpace {
    #[default]
    Oklch,
    Srgb,
}

impl CssColorMixSpace {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Oklch => "oklch",
            Self::Srgb => "srgb",
        }
    }
}

pub trait LayerStackingPort {
    fn stack_layers(
        &self,
        options: StackOptions,
        layers: &[ColorLayer],
        base_color: &str,
    ) -> Result<CompositedResult, OkyctError>;

    fn stack_state_layers(
        &self,
        states: &[StackStateInput],
        base: &str,
        state_color: &str,
    ) -> Result<CompositedResult, OkyctError>;

    fn audit_stacked_contrast(
        &self,
        foreground_hex: &str,
        composited: &CompositedResult,
    ) -> Result<StackedContrastReport, OkyctError>;

    fn stack_to_css_color_mix(
        &self,
        space: CssColorMixSpace,
        layers: &[ColorLayer],
        base_expr: &str,
    ) -> Result<String, OkyctError>;
}
