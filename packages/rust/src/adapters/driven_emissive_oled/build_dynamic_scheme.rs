use crate::application::{build_dynamic_scheme_with_physics, create_palettes_from_source};
use crate::domain::models::{ContrastMetric, GamutTarget, OkyctError};
use crate::ports::inbound::{
    AmbientSurround, BuildDynamicSchemeOptions, CreatePalettesOptions, DynamicSchemeColors,
    EmissiveSchemeOptions, PaletteSet, PaletteVariant, StateLayerBlendSpace, StateLayersOption,
    ThemeMode, TonalPalettePort,
};
use super::internal::oled_display_physics_adapter::OLED_DISPLAY_PHYSICS_SINGLETON;

#[derive(Debug, Clone, PartialEq)]
pub struct BuildSchemeOptions {
    pub mode: ThemeMode,
    pub variant: PaletteVariant,
    pub harmonize_semantics: bool,
    pub contrast_level: f64,
    pub contrast_metric: ContrastMetric,
    pub ambient: AmbientSurround,
    pub emissive: EmissiveSchemeOptions,
    pub gamut: GamutTarget,
    pub hk_compensation: bool,
    pub soft_knee: bool,
    pub state_layers: StateLayersOption,
    pub state_layers_blend_space: StateLayerBlendSpace,
    pub state_layers_contrast_guard: bool,
}

impl Default for BuildSchemeOptions {
    fn default() -> Self {
        Self {
            mode: ThemeMode::Dark,
            variant: PaletteVariant::TonalSpot,
            harmonize_semantics: true,
            contrast_level: 0.0,
            contrast_metric: ContrastMetric::Both,
            ambient: AmbientSurround::Normal,
            emissive: EmissiveSchemeOptions::default(),
            gamut: GamutTarget::Srgb,
            hk_compensation: false,
            soft_knee: true,
            state_layers: StateLayersOption::Disabled,
            state_layers_blend_space: StateLayerBlendSpace::Okyct,
            state_layers_contrast_guard: false,
        }
    }
}

pub fn build_dynamic_scheme_from_palettes<P: TonalPalettePort>(
    palettes: &PaletteSet<P>,
    options: &BuildSchemeOptions,
) -> Result<DynamicSchemeColors, OkyctError> {
    build_dynamic_scheme_with_physics(
        palettes,
        &BuildDynamicSchemeOptions {
            mode: options.mode,
            contrast_level: options.contrast_level,
            contrast_metric: options.contrast_metric,
            ambient: options.ambient,
            emissive: options.emissive,
            state_layers: options.state_layers.clone(),
            state_layers_blend_space: options.state_layers_blend_space,
            state_layers_contrast_guard: options.state_layers_contrast_guard,
        },
        Some(&OLED_DISPLAY_PHYSICS_SINGLETON),
    )
}

pub fn build_dynamic_scheme(
    source_hex: &str,
    options: &BuildSchemeOptions,
) -> Result<DynamicSchemeColors, OkyctError> {
    let palettes = create_palettes_from_source(
        source_hex,
        CreatePalettesOptions {
            gamut: options.gamut,
            hk_compensation: options.hk_compensation,
            soft_knee: options.soft_knee,
            max_cache_size: 256,
            variant: options.variant,
            harmonize_semantics: options.harmonize_semantics,
        },
    )?;
    build_dynamic_scheme_from_palettes(&palettes, options)
}
