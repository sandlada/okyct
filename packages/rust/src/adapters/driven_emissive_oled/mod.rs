pub mod analyze_emissive_scheme_metrics;
pub mod apply_blue_burn_in_guard;
pub mod apply_emissive_profile_to_token_hex;
pub mod build_dynamic_scheme;
pub mod compute_color_emissive_telemetry;
pub mod emissive_panel_specs;
pub(crate) mod internal;

pub use analyze_emissive_scheme_metrics::analyze_emissive_scheme_metrics;
pub use apply_blue_burn_in_guard::apply_blue_burn_in_guard;
pub use apply_emissive_profile_to_token_hex::apply_emissive_profile_to_token_hex;
pub use build_dynamic_scheme::{
    BuildSchemeOptions, build_dynamic_scheme, build_dynamic_scheme_from_palettes,
};
pub use compute_color_emissive_telemetry::compute_color_emissive_telemetry;
pub use emissive_panel_specs::{EMISSIVE_PANEL_SPECS, get_emissive_panel_spec};
