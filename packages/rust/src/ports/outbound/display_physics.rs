use crate::domain::models::OkyctError;
use super::super::inbound::scheme_building::{
    DynamicSchemeColors, EmissivePanelType, SystemColorToken,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SubpixelGeometry {
    RgbStripe,
    DiamondPentile,
    MicroOledHex,
    WrgbStripe,
}

impl SubpixelGeometry {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::RgbStripe => "rgb-stripe",
            Self::DiamondPentile => "diamond-pentile",
            Self::MicroOledHex => "micro-oled-hex",
            Self::WrgbStripe => "wrgb-stripe",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DarkSurfaceTones {
    pub lowest: f64,
    pub surface: f64,
    pub low: f64,
    pub container: f64,
    pub high: f64,
    pub highest: f64,
    pub bright: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct EmissivePanelSpec {
    pub id: EmissivePanelType,
    pub name: &'static str,
    pub short_name: &'static str,
    pub badge: &'static str,
    pub subpixel_geometry: SubpixelGeometry,
    pub geometry_label: &'static str,
    pub description: &'static str,
    pub dark_surface_tones: DarkSurfaceTones,
    pub light_peak_tone_cap: f64,
    pub smear_rise_time_ms: f64,
}

pub const DEFAULT_EMISSIVE_PANEL_SPECS: [EmissivePanelSpec; 5] = [
    EmissivePanelSpec {
        id: EmissivePanelType::StandardLcd,
        name: "Standard IPS / Mini-LED LCD",
        short_name: "Standard LCD",
        badge: "Global Backlight",
        subpixel_geometry: SubpixelGeometry::RgbStripe,
        geometry_label: "RGB Stripe (Standard Vertical Subpixels)",
        description: "Relies on a constant backlight modulated by liquid crystals; power draw is largely independent of pixel tone with zero subpixel cutoff or burn-in.",
        dark_surface_tones: DarkSurfaceTones {
            lowest: 4.0,
            surface: 6.0,
            low: 10.0,
            container: 12.0,
            high: 17.0,
            highest: 22.0,
            bright: 24.0,
        },
        light_peak_tone_cap: 100.0,
        smear_rise_time_ms: 4.5,
    },
    EmissivePanelSpec {
        id: EmissivePanelType::OledTrueBlack,
        name: "OLED True-Black (Zero-Power Cutoff)",
        short_name: "OLED True-Black",
        badge: "T=0 Pixel Cutoff",
        subpixel_geometry: SubpixelGeometry::RgbStripe,
        geometry_label: "RGB OLED (Self-Emissive Pixels)",
        description: "Anchors base dark surfaces to #000000 (T=0) to fully power down organic emitters for maximum static battery savings, trading off ~18.5 ms turn-on black smearing.",
        dark_surface_tones: DarkSurfaceTones {
            lowest: 0.0,
            surface: 0.0,
            low: 4.0,
            container: 8.0,
            high: 13.0,
            highest: 18.0,
            bright: 22.0,
        },
        light_peak_tone_cap: 100.0,
        smear_rise_time_ms: 18.5,
    },
    EmissivePanelSpec {
        id: EmissivePanelType::AmoledAntiSmear,
        name: "AMOLED 120Hz Anti-Smear (Pre-Biased)",
        short_name: "AMOLED Anti-Smear",
        badge: "T=4 Sub-Threshold Bias",
        subpixel_geometry: SubpixelGeometry::DiamondPentile,
        geometry_label: "Diamond PenTile (Subpixel-Shared Matrix)",
        description: "Tuned for 120Hz mobile AMOLED panels: holds lowest dark surfaces above sub-threshold turn-on (T=3..4) to eliminate scroll black smearing and tame PenTile fringing.",
        dark_surface_tones: DarkSurfaceTones {
            lowest: 3.0,
            surface: 4.0,
            low: 8.0,
            container: 12.0,
            high: 16.0,
            highest: 21.0,
            bright: 24.0,
        },
        light_peak_tone_cap: 98.0,
        smear_rise_time_ms: 1.6,
    },
    EmissivePanelSpec {
        id: EmissivePanelType::MicroOledXr,
        name: "MicroOLED Silicon XR (Low-Halation)",
        short_name: "MicroOLED XR",
        badge: "Anti-Halation + Anti-ABL",
        subpixel_geometry: SubpixelGeometry::MicroOledHex,
        geometry_label: "Silicon Tandem Micro-Cavity",
        description: "Engineered for XR headsets: raises dark velvet floor to T=8 and caps peak highlights at T=92 to suppress Pancake lens internal halation and backplane ABL dimming.",
        dark_surface_tones: DarkSurfaceTones {
            lowest: 6.0,
            surface: 8.0,
            low: 12.0,
            container: 16.0,
            high: 20.0,
            highest: 25.0,
            bright: 28.0,
        },
        light_peak_tone_cap: 92.0,
        smear_rise_time_ms: 0.4,
    },
    EmissivePanelSpec {
        id: EmissivePanelType::WoledDesktop,
        name: "WRGB Tandem OLED (Desktop / TV)",
        short_name: "WOLED Desktop",
        badge: "WRGB White Subpixel",
        subpixel_geometry: SubpixelGeometry::WrgbStripe,
        geometry_label: "WRGB Stripe (White Subpixel Assisted)",
        description: "Models desktop/TV WRGB Tandem OLED panels where a dedicated high-efficiency white subpixel carries achromatic luminance, reducing RGB emitter stress on bright surfaces.",
        dark_surface_tones: DarkSurfaceTones {
            lowest: 2.0,
            surface: 4.0,
            low: 8.0,
            container: 12.0,
            high: 16.0,
            highest: 21.0,
            bright: 24.0,
        },
        light_peak_tone_cap: 98.0,
        smear_rise_time_ms: 0.3,
    },
];

pub const fn default_panel_spec(profile: EmissivePanelType) -> EmissivePanelSpec {
    match profile {
        EmissivePanelType::StandardLcd => DEFAULT_EMISSIVE_PANEL_SPECS[0],
        EmissivePanelType::OledTrueBlack => DEFAULT_EMISSIVE_PANEL_SPECS[1],
        EmissivePanelType::AmoledAntiSmear => DEFAULT_EMISSIVE_PANEL_SPECS[2],
        EmissivePanelType::MicroOledXr => DEFAULT_EMISSIVE_PANEL_SPECS[3],
        EmissivePanelType::WoledDesktop => DEFAULT_EMISSIVE_PANEL_SPECS[4],
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum EmitterState {
    Off,
    NearBlack,
    Active,
}

impl EmitterState {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Off => "off",
            Self::NearBlack => "near-black",
            Self::Active => "active",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ChannelPowerMw {
    pub r: f64,
    pub g: f64,
    pub b: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ColorEmissiveTelemetry {
    pub hex: String,
    pub r_linear: f64,
    pub g_linear: f64,
    pub b_linear: f64,
    pub power_mw: f64,
    pub channel_power_mw: ChannelPowerMw,
    pub apl_percent: f64,
    pub blue_stress_index: f64,
    pub is_pixel_off: bool,
    pub emitter_state: EmitterState,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EmissiveRoleKind {
    Surface,
    Foreground,
    Accent,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ContrastRolePair {
    pub fg_role: SystemColorToken,
    pub bg_role: SystemColorToken,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SchemeEmissiveReport {
    pub profile: EmissivePanelType,
    pub spec: EmissivePanelSpec,
    pub estimated_total_power_mw: f64,
    pub power_savings_vs_lcd_pct: f64,
    pub channel_power_breakdown_mw: ChannelPowerMw,
    pub apl_percent: f64,
    pub abl_trigger_risk: &'static str,
    pub blue_subpixel_stress_index: f64,
    pub smear_rise_time_ms: f64,
    pub black_smear_risk: &'static str,
    pub pentile_fringing_risk: &'static str,
    pub pixel_off_ratio_pct: f64,
    pub min_wcag_contrast_after_opt: f64,
    pub min_wcag_contrast_pair: ContrastRolePair,
}

pub trait DisplayPhysicsPort {
    fn get_panel_spec(&self, profile: EmissivePanelType) -> EmissivePanelSpec;
    fn apply_blue_burn_in_guard(
        &self,
        hex: &str,
        max_blue_attenuation: f64,
        hue_shift_deg: f64,
    ) -> Result<String, OkyctError>;
    fn apply_subpixel_edge_compensation(
        &self,
        hex: &str,
        profile: EmissivePanelType,
        role_kind: EmissiveRoleKind,
    ) -> Result<String, OkyctError>;
    fn compute_color_emissive_telemetry(&self, hex: &str) -> Result<ColorEmissiveTelemetry, OkyctError>;
    fn analyze_emissive_scheme_metrics(
        &self,
        scheme: &DynamicSchemeColors,
        profile: EmissivePanelType,
    ) -> Result<SchemeEmissiveReport, OkyctError>;
}
