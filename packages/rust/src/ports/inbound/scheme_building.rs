use std::collections::BTreeMap;
use crate::domain::models::{ContrastMetric, CvdType, Okyct, OkyctError};
use super::palette_generation::{PaletteSet, TonalPalettePort};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum ThemeMode {
    #[default]
    Light,
    Dark,
}

impl ThemeMode {
    pub const ALL: [Self; 2] = [Self::Light, Self::Dark];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Light => "light",
            Self::Dark => "dark",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "light" => Some(Self::Light),
            "dark" => Some(Self::Dark),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum AmbientSurround {
    Bright,
    #[default]
    Normal,
    Darkroom,
}

impl AmbientSurround {
    pub const ALL: [Self; 3] = [Self::Bright, Self::Normal, Self::Darkroom];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Bright => "bright",
            Self::Normal => "normal",
            Self::Darkroom => "darkroom",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "bright" => Some(Self::Bright),
            "normal" => Some(Self::Normal),
            "darkroom" => Some(Self::Darkroom),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum EmissivePanelType {
    #[default]
    StandardLcd,
    OledTrueBlack,
    AmoledAntiSmear,
    MicroOledXr,
    WoledDesktop,
}

impl EmissivePanelType {
    pub const ALL: [Self; 5] = [
        Self::StandardLcd,
        Self::OledTrueBlack,
        Self::AmoledAntiSmear,
        Self::MicroOledXr,
        Self::WoledDesktop,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::StandardLcd => "standard-lcd",
            Self::OledTrueBlack => "oled-true-black",
            Self::AmoledAntiSmear => "amoled-anti-smear",
            Self::MicroOledXr => "micro-oled-xr",
            Self::WoledDesktop => "woled-desktop",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "standard-lcd" => Some(Self::StandardLcd),
            "oled-true-black" => Some(Self::OledTrueBlack),
            "amoled-anti-smear" => Some(Self::AmoledAntiSmear),
            "micro-oled-xr" => Some(Self::MicroOledXr),
            "woled-desktop" => Some(Self::WoledDesktop),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum StateLayerState {
    Hovered,
    Focused,
    Pressed,
    Dragged,
}

impl StateLayerState {
    pub const ALL: [Self; 4] = [Self::Hovered, Self::Focused, Self::Pressed, Self::Dragged];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Hovered => "hovered",
            Self::Focused => "focused",
            Self::Pressed => "pressed",
            Self::Dragged => "dragged",
        }
    }

    pub const fn pascal_str(self) -> &'static str {
        match self {
            Self::Hovered => "Hovered",
            Self::Focused => "Focused",
            Self::Pressed => "Pressed",
            Self::Dragged => "Dragged",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "hovered" => Some(Self::Hovered),
            "focused" => Some(Self::Focused),
            "pressed" => Some(Self::Pressed),
            "dragged" => Some(Self::Dragged),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum StateLayersOption {
    #[default]
    Disabled,
    All,
    Selected(Vec<StateLayerState>),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum StateLayerBlendSpace {
    #[default]
    Okyct,
    GammaSrgb,
    LinearSrgb,
}

impl StateLayerBlendSpace {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Okyct => "okyct",
            Self::GammaSrgb => "gamma-srgb",
            Self::LinearSrgb => "linear-srgb",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EmissiveSchemeOptions {
    pub profile: EmissivePanelType,
    pub burn_in_guard: bool,
    pub anti_fringing: bool,
    pub abl_guard: bool,
}

impl Default for EmissiveSchemeOptions {
    fn default() -> Self {
        Self {
            profile: EmissivePanelType::StandardLcd,
            burn_in_guard: false,
            anti_fringing: false,
            abl_guard: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct BuildDynamicSchemeOptions {
    pub mode: ThemeMode,
    pub contrast_level: f64,
    pub contrast_metric: ContrastMetric,
    pub ambient: AmbientSurround,
    pub emissive: EmissiveSchemeOptions,
    pub state_layers: StateLayersOption,
    pub state_layers_blend_space: StateLayerBlendSpace,
    pub state_layers_contrast_guard: bool,
}

impl Default for BuildDynamicSchemeOptions {
    fn default() -> Self {
        Self {
            mode: ThemeMode::Dark,
            contrast_level: 0.0,
            contrast_metric: ContrastMetric::Both,
            ambient: AmbientSurround::Normal,
            emissive: EmissiveSchemeOptions::default(),
            state_layers: StateLayersOption::Disabled,
            state_layers_blend_space: StateLayerBlendSpace::Okyct,
            state_layers_contrast_guard: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ResolveCustomColorsOptions {
    pub mode: ThemeMode,
    pub contrast_level: f64,
    pub contrast_metric: ContrastMetric,
    pub state_layers: StateLayersOption,
    pub state_layers_blend_space: StateLayerBlendSpace,
    pub state_layers_contrast_guard: bool,
}

impl Default for ResolveCustomColorsOptions {
    fn default() -> Self {
        Self {
            mode: ThemeMode::Dark,
            contrast_level: 0.0,
            contrast_metric: ContrastMetric::Both,
            state_layers: StateLayersOption::Disabled,
            state_layers_blend_space: StateLayerBlendSpace::Okyct,
            state_layers_contrast_guard: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CustomColorInput {
    pub id: Option<String>,
    pub name: String,
    pub label: Option<String>,
    pub source_hex: String,
    pub harmonize: Option<bool>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ResolvedCustomColor {
    pub id: String,
    pub name: String,
    pub label: String,
    pub source_hex: String,
    pub harmonized_hex: String,
    pub hue_shift_deg: f64,
    pub color: String,
    pub on_color: String,
    pub color_container: String,
    pub on_color_container: String,
    pub wcag_ratio_color: f64,
    pub wcag_ratio_container: f64,
    pub apca_lc_color: f64,
    pub apca_lc_container: f64,
    pub state_layers: Option<BTreeMap<String, String>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum SystemColorToken {
    Primary,
    OnPrimary,
    PrimaryContainer,
    OnPrimaryContainer,
    PrimaryFixed,
    PrimaryFixedDim,
    OnPrimaryFixed,
    OnPrimaryFixedVariant,
    Secondary,
    OnSecondary,
    SecondaryContainer,
    OnSecondaryContainer,
    Tertiary,
    OnTertiary,
    TertiaryContainer,
    OnTertiaryContainer,
    Error,
    OnError,
    ErrorContainer,
    OnErrorContainer,
    Warning,
    OnWarning,
    WarningContainer,
    OnWarningContainer,
    Success,
    OnSuccess,
    SuccessContainer,
    OnSuccessContainer,
    Info,
    OnInfo,
    InfoContainer,
    OnInfoContainer,
    Surface,
    OnSurface,
    SurfaceVariant,
    OnSurfaceVariant,
    SurfaceDim,
    SurfaceBright,
    SurfaceContainerLowest,
    SurfaceContainerLow,
    SurfaceContainer,
    SurfaceContainerHigh,
    SurfaceContainerHighest,
    Outline,
    OutlineVariant,
    InverseSurface,
    InverseOnSurface,
    InversePrimary,
    InverseOnPrimary,
    InversePrimaryContainer,
    InverseOnPrimaryContainer,
    Scrim,
    Shadow,
}

impl SystemColorToken {
    pub const ALL: [Self; 53] = [
        Self::Primary,
        Self::OnPrimary,
        Self::PrimaryContainer,
        Self::OnPrimaryContainer,
        Self::PrimaryFixed,
        Self::PrimaryFixedDim,
        Self::OnPrimaryFixed,
        Self::OnPrimaryFixedVariant,
        Self::Secondary,
        Self::OnSecondary,
        Self::SecondaryContainer,
        Self::OnSecondaryContainer,
        Self::Tertiary,
        Self::OnTertiary,
        Self::TertiaryContainer,
        Self::OnTertiaryContainer,
        Self::Error,
        Self::OnError,
        Self::ErrorContainer,
        Self::OnErrorContainer,
        Self::Warning,
        Self::OnWarning,
        Self::WarningContainer,
        Self::OnWarningContainer,
        Self::Success,
        Self::OnSuccess,
        Self::SuccessContainer,
        Self::OnSuccessContainer,
        Self::Info,
        Self::OnInfo,
        Self::InfoContainer,
        Self::OnInfoContainer,
        Self::Surface,
        Self::OnSurface,
        Self::SurfaceVariant,
        Self::OnSurfaceVariant,
        Self::SurfaceDim,
        Self::SurfaceBright,
        Self::SurfaceContainerLowest,
        Self::SurfaceContainerLow,
        Self::SurfaceContainer,
        Self::SurfaceContainerHigh,
        Self::SurfaceContainerHighest,
        Self::Outline,
        Self::OutlineVariant,
        Self::InverseSurface,
        Self::InverseOnSurface,
        Self::InversePrimary,
        Self::InverseOnPrimary,
        Self::InversePrimaryContainer,
        Self::InverseOnPrimaryContainer,
        Self::Scrim,
        Self::Shadow,
    ];

    pub const STATEFUL: [Self; 49] = [
        Self::Primary,
        Self::OnPrimary,
        Self::PrimaryContainer,
        Self::OnPrimaryContainer,
        Self::PrimaryFixed,
        Self::PrimaryFixedDim,
        Self::OnPrimaryFixed,
        Self::OnPrimaryFixedVariant,
        Self::Secondary,
        Self::OnSecondary,
        Self::SecondaryContainer,
        Self::OnSecondaryContainer,
        Self::Tertiary,
        Self::OnTertiary,
        Self::TertiaryContainer,
        Self::OnTertiaryContainer,
        Self::Error,
        Self::OnError,
        Self::ErrorContainer,
        Self::OnErrorContainer,
        Self::Warning,
        Self::OnWarning,
        Self::WarningContainer,
        Self::OnWarningContainer,
        Self::Success,
        Self::OnSuccess,
        Self::SuccessContainer,
        Self::OnSuccessContainer,
        Self::Info,
        Self::OnInfo,
        Self::InfoContainer,
        Self::OnInfoContainer,
        Self::Surface,
        Self::OnSurface,
        Self::SurfaceVariant,
        Self::OnSurfaceVariant,
        Self::SurfaceDim,
        Self::SurfaceBright,
        Self::SurfaceContainerLowest,
        Self::SurfaceContainerLow,
        Self::SurfaceContainer,
        Self::SurfaceContainerHigh,
        Self::SurfaceContainerHighest,
        Self::InverseSurface,
        Self::InverseOnSurface,
        Self::InversePrimary,
        Self::InverseOnPrimary,
        Self::InversePrimaryContainer,
        Self::InverseOnPrimaryContainer,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Primary => "primary",
            Self::OnPrimary => "onPrimary",
            Self::PrimaryContainer => "primaryContainer",
            Self::OnPrimaryContainer => "onPrimaryContainer",
            Self::PrimaryFixed => "primaryFixed",
            Self::PrimaryFixedDim => "primaryFixedDim",
            Self::OnPrimaryFixed => "onPrimaryFixed",
            Self::OnPrimaryFixedVariant => "onPrimaryFixedVariant",
            Self::Secondary => "secondary",
            Self::OnSecondary => "onSecondary",
            Self::SecondaryContainer => "secondaryContainer",
            Self::OnSecondaryContainer => "onSecondaryContainer",
            Self::Tertiary => "tertiary",
            Self::OnTertiary => "onTertiary",
            Self::TertiaryContainer => "tertiaryContainer",
            Self::OnTertiaryContainer => "onTertiaryContainer",
            Self::Error => "error",
            Self::OnError => "onError",
            Self::ErrorContainer => "errorContainer",
            Self::OnErrorContainer => "onErrorContainer",
            Self::Warning => "warning",
            Self::OnWarning => "onWarning",
            Self::WarningContainer => "warningContainer",
            Self::OnWarningContainer => "onWarningContainer",
            Self::Success => "success",
            Self::OnSuccess => "onSuccess",
            Self::SuccessContainer => "successContainer",
            Self::OnSuccessContainer => "onSuccessContainer",
            Self::Info => "info",
            Self::OnInfo => "onInfo",
            Self::InfoContainer => "infoContainer",
            Self::OnInfoContainer => "onInfoContainer",
            Self::Surface => "surface",
            Self::OnSurface => "onSurface",
            Self::SurfaceVariant => "surfaceVariant",
            Self::OnSurfaceVariant => "onSurfaceVariant",
            Self::SurfaceDim => "surfaceDim",
            Self::SurfaceBright => "surfaceBright",
            Self::SurfaceContainerLowest => "surfaceContainerLowest",
            Self::SurfaceContainerLow => "surfaceContainerLow",
            Self::SurfaceContainer => "surfaceContainer",
            Self::SurfaceContainerHigh => "surfaceContainerHigh",
            Self::SurfaceContainerHighest => "surfaceContainerHighest",
            Self::Outline => "outline",
            Self::OutlineVariant => "outlineVariant",
            Self::InverseSurface => "inverseSurface",
            Self::InverseOnSurface => "inverseOnSurface",
            Self::InversePrimary => "inversePrimary",
            Self::InverseOnPrimary => "inverseOnPrimary",
            Self::InversePrimaryContainer => "inversePrimaryContainer",
            Self::InverseOnPrimaryContainer => "inverseOnPrimaryContainer",
            Self::Scrim => "scrim",
            Self::Shadow => "shadow",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        Self::ALL.iter().copied().find(|t| t.as_str() == value)
    }

    pub const fn is_stateful(self) -> bool {
        !matches!(
            self,
            Self::Outline | Self::OutlineVariant | Self::Scrim | Self::Shadow
        )
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct DynamicSchemeColors {
    pub colors: BTreeMap<SystemColorToken, String>,
    pub tones: BTreeMap<SystemColorToken, f64>,
    pub okyct: BTreeMap<SystemColorToken, Okyct>,
    pub state_layers: Option<BTreeMap<String, String>>,
}

impl DynamicSchemeColors {
    pub fn get(&self, token: SystemColorToken) -> &str {
        self.colors.get(&token).map(String::as_str).unwrap_or("")
    }

    pub fn get_by_name(&self, name: &str) -> Option<&str> {
        if let Some(token) = SystemColorToken::parse(name) {
            return self.colors.get(&token).map(String::as_str);
        }
        self.state_layers
            .as_ref()
            .and_then(|sl| sl.get(name))
            .map(String::as_str)
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ContrastAuditItem {
    pub fg_role: SystemColorToken,
    pub bg_role: SystemColorToken,
    pub fg_tone: f64,
    pub bg_tone: f64,
    pub wcag_ratio: f64,
    pub wcag_pass_aa: bool,
    pub wcag_pass_aaa: bool,
    pub apca_lc: f64,
    pub apca_pass: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CvdSeparabilityAuditItem {
    pub role_a: SystemColorToken,
    pub role_b: SystemColorToken,
    pub cvd_type: CvdType,
    pub delta_e_oklab: f64,
    pub delta_tone: f64,
    pub separable: bool,
    pub recommendation: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AuditSchemeCvdOptions {
    pub cvd_types: Vec<CvdType>,
    pub severity: f64,
    pub min_delta_e: f64,
    pub min_delta_tone: f64,
}

impl Default for AuditSchemeCvdOptions {
    fn default() -> Self {
        Self {
            cvd_types: vec![
                CvdType::Protanopia,
                CvdType::Deuteranopia,
                CvdType::Tritanopia,
            ],
            severity: 1.0,
            min_delta_e: 0.06,
            min_delta_tone: 12.0,
        }
    }
}

pub trait SchemeBuildingPort<P: TonalPalettePort> {
    fn build_dynamic_scheme(
        &self,
        palettes: &PaletteSet<P>,
        options: &BuildDynamicSchemeOptions,
    ) -> Result<DynamicSchemeColors, OkyctError>;

    fn resolve_custom_colors(
        &self,
        configs: &[CustomColorInput],
        primary_seed_hex: &str,
        options: &ResolveCustomColorsOptions,
    ) -> Result<Vec<ResolvedCustomColor>, OkyctError>;

    fn audit_scheme_contrast(&self, scheme: &DynamicSchemeColors) -> Result<Vec<ContrastAuditItem>, OkyctError>;
}
