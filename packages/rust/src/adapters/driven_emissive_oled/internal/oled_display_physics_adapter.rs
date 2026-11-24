use crate::domain::models::OkyctError;
use crate::ports::inbound::{DynamicSchemeColors, EmissivePanelType};
use crate::ports::outbound::{
    ColorEmissiveTelemetry, DisplayPhysicsPort, EmissivePanelSpec, EmissiveRoleKind,
    SchemeEmissiveReport, default_panel_spec,
};
use super::super::analyze_emissive_scheme_metrics::analyze_emissive_scheme_metrics;
use super::super::apply_blue_burn_in_guard::apply_blue_burn_in_guard;
use super::super::compute_color_emissive_telemetry::compute_color_emissive_telemetry;
use super::apply_subpixel_edge_compensation::apply_subpixel_edge_compensation;

#[derive(Debug, Clone, Copy, Default)]
pub struct OledDisplayPhysicsAdapter;

impl DisplayPhysicsPort for OledDisplayPhysicsAdapter {
    fn get_panel_spec(&self, profile: EmissivePanelType) -> EmissivePanelSpec {
        default_panel_spec(profile)
    }

    fn apply_blue_burn_in_guard(
        &self,
        hex: &str,
        max_blue_attenuation: f64,
        hue_shift_deg: f64,
    ) -> Result<String, OkyctError> {
        apply_blue_burn_in_guard(hex, max_blue_attenuation, hue_shift_deg)
    }

    fn apply_subpixel_edge_compensation(
        &self,
        hex: &str,
        profile: EmissivePanelType,
        role_kind: EmissiveRoleKind,
    ) -> Result<String, OkyctError> {
        apply_subpixel_edge_compensation(hex, profile, role_kind)
    }

    fn compute_color_emissive_telemetry(
        &self,
        hex: &str,
    ) -> Result<ColorEmissiveTelemetry, OkyctError> {
        compute_color_emissive_telemetry(hex)
    }

    fn analyze_emissive_scheme_metrics(
        &self,
        scheme: &DynamicSchemeColors,
        profile: EmissivePanelType,
    ) -> Result<SchemeEmissiveReport, OkyctError> {
        analyze_emissive_scheme_metrics(scheme, profile)
    }
}

pub static OLED_DISPLAY_PHYSICS_SINGLETON: OledDisplayPhysicsAdapter = OledDisplayPhysicsAdapter;
