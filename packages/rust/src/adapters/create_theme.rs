use crate::application::{
    TonalPalette, audit_scheme_contrast, create_palettes_from_source, resolve_custom_colors,
};
use crate::domain::models::{ContrastMetric, GamutTarget, Okyct, OkyctError};
use crate::domain::services::hex_to_okyct;
use crate::ports::inbound::{
    AmbientSurround, ContrastAuditItem, CreatePalettesOptions, CustomColorInput,
    DynamicSchemeColors, EmissiveSchemeOptions, PaletteSet, PaletteVariant,
    ResolveCustomColorsOptions, ResolvedCustomColor, StateLayerBlendSpace, StateLayersOption,
    ThemeMode,
};
use crate::ports::outbound::SchemeEmissiveReport;
use super::driven_emissive_oled::{
    BuildSchemeOptions, analyze_emissive_scheme_metrics, build_dynamic_scheme_from_palettes,
};
use super::driven_exporters::{ExportThemeInput, ExportThemeOptions, export_theme};
use super::driving_fp::{TokenDictionary, to_token_dictionary};

#[derive(Debug, Clone)]
pub struct CreateThemeOptions {
    pub source_hex: String,
    pub variant: PaletteVariant,
    pub harmonize_semantics: bool,
    pub contrast_level: f64,
    pub contrast_metric: ContrastMetric,
    pub ambient: AmbientSurround,
    pub gamut: GamutTarget,
    pub hk_compensation: bool,
    pub soft_knee: bool,
    pub emissive: EmissiveSchemeOptions,
    pub custom_colors: Vec<CustomColorInput>,
    pub state_layers: StateLayersOption,
    pub state_layers_blend_space: StateLayerBlendSpace,
    pub state_layers_contrast_guard: bool,
}

impl CreateThemeOptions {
    pub fn new(source_hex: impl Into<String>) -> Self {
        Self {
            source_hex: source_hex.into(),
            variant: PaletteVariant::TonalSpot,
            harmonize_semantics: true,
            contrast_level: 0.0,
            contrast_metric: ContrastMetric::Both,
            ambient: AmbientSurround::Normal,
            gamut: GamutTarget::Srgb,
            hk_compensation: false,
            soft_knee: true,
            emissive: EmissiveSchemeOptions::default(),
            custom_colors: Vec::new(),
            state_layers: StateLayersOption::Disabled,
            state_layers_blend_space: StateLayerBlendSpace::Okyct,
            state_layers_contrast_guard: false,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ThemeSchemes {
    pub light: DynamicSchemeColors,
    pub dark: DynamicSchemeColors,
}

#[derive(Debug, Clone)]
pub struct ThemeCustomColors {
    pub light: Vec<ResolvedCustomColor>,
    pub dark: Vec<ResolvedCustomColor>,
}

#[derive(Debug, Clone)]
pub struct OkyctTheme {
    pub source_hex: String,
    pub source_okyct: Okyct,
    pub variant: PaletteVariant,
    pub contrast_level: f64,
    pub contrast_metric: ContrastMetric,
    pub emissive: EmissiveSchemeOptions,
    pub palettes: PaletteSet<TonalPalette>,
    pub schemes: ThemeSchemes,
    pub custom_colors: ThemeCustomColors,
}

impl OkyctTheme {
    pub fn scheme(&self, mode: ThemeMode) -> &DynamicSchemeColors {
        match mode {
            ThemeMode::Light => &self.schemes.light,
            ThemeMode::Dark => &self.schemes.dark,
        }
    }

    pub fn tokens(
        &self,
        mode: ThemeMode,
        include_custom_colors: bool,
        include_state_layers: bool,
    ) -> Result<TokenDictionary, OkyctError> {
        let target_scheme = self.scheme(mode);
        let target_custom: &[ResolvedCustomColor] = if !include_custom_colors {
            &[]
        } else {
            match mode {
                ThemeMode::Light => &self.custom_colors.light,
                ThemeMode::Dark => &self.custom_colors.dark,
            }
        };
        to_token_dictionary(target_scheme, target_custom, include_state_layers)
    }

    pub fn audit_contrast(&self, mode: ThemeMode) -> Result<Vec<ContrastAuditItem>, OkyctError> {
        audit_scheme_contrast(self.scheme(mode))
    }

    pub fn analyze_emissive(&self, mode: ThemeMode) -> Result<SchemeEmissiveReport, OkyctError> {
        analyze_emissive_scheme_metrics(self.scheme(mode), self.emissive.profile)
    }

    pub fn export(&self, options: &ExportThemeOptions) -> Result<String, OkyctError> {
        let input = ExportThemeInput {
            light_scheme: &self.schemes.light,
            dark_scheme: &self.schemes.dark,
            palettes: Some(&self.palettes),
            custom_colors_light: &self.custom_colors.light,
            custom_colors_dark: &self.custom_colors.dark,
        };
        export_theme(&input, options)
    }
}

pub fn create_theme(options: &CreateThemeOptions) -> Result<OkyctTheme, OkyctError> {
    let source_okyct = hex_to_okyct(&options.source_hex)?;
    if !options.contrast_level.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid contrastLevel: {}. Expected a finite number in [-1.0, 1.0].",
            options.contrast_level
        )));
    }
    let contrast_level = options.contrast_level.clamp(-1.0, 1.0);

    let palettes = create_palettes_from_source(
        &options.source_hex,
        CreatePalettesOptions {
            gamut: options.gamut,
            hk_compensation: options.hk_compensation,
            soft_knee: options.soft_knee,
            max_cache_size: 256,
            variant: options.variant,
            harmonize_semantics: options.harmonize_semantics,
        },
    )?;

    let light_scheme = build_dynamic_scheme_from_palettes(
        &palettes,
        &BuildSchemeOptions {
            mode: ThemeMode::Light,
            variant: options.variant,
            harmonize_semantics: options.harmonize_semantics,
            contrast_level,
            contrast_metric: options.contrast_metric,
            ambient: options.ambient,
            emissive: options.emissive,
            gamut: options.gamut,
            hk_compensation: options.hk_compensation,
            soft_knee: options.soft_knee,
            state_layers: options.state_layers.clone(),
            state_layers_blend_space: options.state_layers_blend_space,
            state_layers_contrast_guard: options.state_layers_contrast_guard,
        },
    )?;

    let dark_scheme = build_dynamic_scheme_from_palettes(
        &palettes,
        &BuildSchemeOptions {
            mode: ThemeMode::Dark,
            variant: options.variant,
            harmonize_semantics: options.harmonize_semantics,
            contrast_level,
            contrast_metric: options.contrast_metric,
            ambient: options.ambient,
            emissive: options.emissive,
            gamut: options.gamut,
            hk_compensation: options.hk_compensation,
            soft_knee: options.soft_knee,
            state_layers: options.state_layers.clone(),
            state_layers_blend_space: options.state_layers_blend_space,
            state_layers_contrast_guard: options.state_layers_contrast_guard,
        },
    )?;

    let custom_light = if options.custom_colors.is_empty() {
        Vec::new()
    } else {
        resolve_custom_colors(
            &options.custom_colors,
            &options.source_hex,
            &ResolveCustomColorsOptions {
                mode: ThemeMode::Light,
                contrast_level,
                contrast_metric: options.contrast_metric,
                state_layers: options.state_layers.clone(),
                state_layers_blend_space: options.state_layers_blend_space,
                state_layers_contrast_guard: options.state_layers_contrast_guard,
            },
        )?
    };

    let custom_dark = if options.custom_colors.is_empty() {
        Vec::new()
    } else {
        resolve_custom_colors(
            &options.custom_colors,
            &options.source_hex,
            &ResolveCustomColorsOptions {
                mode: ThemeMode::Dark,
                contrast_level,
                contrast_metric: options.contrast_metric,
                state_layers: options.state_layers.clone(),
                state_layers_blend_space: options.state_layers_blend_space,
                state_layers_contrast_guard: options.state_layers_contrast_guard,
            },
        )?
    };

    Ok(OkyctTheme {
        source_hex: options.source_hex.clone(),
        source_okyct,
        variant: options.variant,
        contrast_level,
        contrast_metric: options.contrast_metric,
        emissive: options.emissive,
        palettes,
        schemes: ThemeSchemes {
            light: light_scheme,
            dark: dark_scheme,
        },
        custom_colors: ThemeCustomColors {
            light: custom_light,
            dark: custom_dark,
        },
    })
}
