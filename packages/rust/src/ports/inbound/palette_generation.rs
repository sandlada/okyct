use std::collections::BTreeMap;
use crate::domain::models::{CssColorFormat, GamutTarget, Okyct, OkyctError};

pub const STANDARD_TONES: [u8; 13] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum PaletteVariant {
    #[default]
    TonalSpot,
    Vibrant,
    Expressive,
    Neutral,
    Monochrome,
    Fidelity,
}

impl PaletteVariant {
    pub const ALL: [Self; 6] = [
        Self::TonalSpot,
        Self::Vibrant,
        Self::Expressive,
        Self::Neutral,
        Self::Monochrome,
        Self::Fidelity,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::TonalSpot => "tonalSpot",
            Self::Vibrant => "vibrant",
            Self::Expressive => "expressive",
            Self::Neutral => "neutral",
            Self::Monochrome => "monochrome",
            Self::Fidelity => "fidelity",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "tonalSpot" => Some(Self::TonalSpot),
            "vibrant" => Some(Self::Vibrant),
            "expressive" => Some(Self::Expressive),
            "neutral" => Some(Self::Neutral),
            "monochrome" => Some(Self::Monochrome),
            "fidelity" => Some(Self::Fidelity),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TonalPaletteOptions {
    pub gamut: GamutTarget,
    pub hk_compensation: bool,
    pub soft_knee: bool,
    pub max_cache_size: usize,
}

impl Default for TonalPaletteOptions {
    fn default() -> Self {
        Self {
            gamut: GamutTarget::Srgb,
            hk_compensation: false,
            soft_knee: true,
            max_cache_size: 256,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CreatePalettesOptions {
    pub gamut: GamutTarget,
    pub hk_compensation: bool,
    pub soft_knee: bool,
    pub max_cache_size: usize,
    pub variant: PaletteVariant,
    pub harmonize_semantics: bool,
}

impl Default for CreatePalettesOptions {
    fn default() -> Self {
        Self {
            gamut: GamutTarget::Srgb,
            hk_compensation: false,
            soft_knee: true,
            max_cache_size: 256,
            variant: PaletteVariant::TonalSpot,
            harmonize_semantics: true,
        }
    }
}

pub trait TonalPalettePort {
    fn hue(&self) -> f64;
    fn target_chroma(&self) -> f64;
    fn gamut(&self) -> GamutTarget;
    fn tone(&self, tone_value: f64) -> Result<String, OkyctError>;
    fn tone_okyct(&self, tone_value: f64, gamut: Option<GamutTarget>) -> Result<Okyct, OkyctError>;
    fn tone_css(&self, tone_value: f64, format: CssColorFormat) -> Result<String, OkyctError>;
    fn get_all_tones(&self) -> Result<BTreeMap<u8, String>, OkyctError>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum StandardPaletteKey {
    Primary,
    Secondary,
    Tertiary,
    Neutral,
    NeutralVariant,
    Error,
    Warning,
    Success,
    Info,
}

impl StandardPaletteKey {
    pub const ALL: [Self; 9] = [
        Self::Primary,
        Self::Secondary,
        Self::Tertiary,
        Self::Neutral,
        Self::NeutralVariant,
        Self::Error,
        Self::Warning,
        Self::Success,
        Self::Info,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Primary => "primary",
            Self::Secondary => "secondary",
            Self::Tertiary => "tertiary",
            Self::Neutral => "neutral",
            Self::NeutralVariant => "neutralVariant",
            Self::Error => "error",
            Self::Warning => "warning",
            Self::Success => "success",
            Self::Info => "info",
        }
    }
}

#[derive(Debug, Clone)]
pub struct PaletteSet<P> {
    pub primary: P,
    pub secondary: P,
    pub tertiary: P,
    pub neutral: P,
    pub neutral_variant: P,
    pub error: P,
    pub warning: P,
    pub success: P,
    pub info: P,
}

impl<P> PaletteSet<P> {
    pub fn get(&self, key: StandardPaletteKey) -> &P {
        match key {
            StandardPaletteKey::Primary => &self.primary,
            StandardPaletteKey::Secondary => &self.secondary,
            StandardPaletteKey::Tertiary => &self.tertiary,
            StandardPaletteKey::Neutral => &self.neutral,
            StandardPaletteKey::NeutralVariant => &self.neutral_variant,
            StandardPaletteKey::Error => &self.error,
            StandardPaletteKey::Warning => &self.warning,
            StandardPaletteKey::Success => &self.success,
            StandardPaletteKey::Info => &self.info,
        }
    }
}

pub trait PaletteGenerationPort<P: TonalPalettePort> {
    fn create_palettes_from_source(
        &self,
        source_hex: &str,
        options: CreatePalettesOptions,
    ) -> Result<PaletteSet<P>, OkyctError>;

    fn harmonize_hex(
        &self,
        design_hex: &str,
        source_hex: &str,
        max_shift_angle: f64,
    ) -> Result<String, OkyctError>;

    fn is_warm_hue(&self, hue: f64) -> Result<bool, OkyctError>;
}
