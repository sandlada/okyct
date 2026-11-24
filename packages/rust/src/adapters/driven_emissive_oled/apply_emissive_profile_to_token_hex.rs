use crate::domain::models::{ColorConversionOptions, Okyct, OkyctError};
use crate::domain::services::{hex_to_okyct, okyct_to_hex, trim_ascii_whitespace};
use crate::ports::inbound::EmissivePanelType;
use crate::ports::outbound::EmissiveRoleKind;
use super::apply_blue_burn_in_guard::apply_blue_burn_in_guard;
use super::emissive_panel_specs::get_emissive_panel_spec;
use super::internal::apply_subpixel_edge_compensation::apply_subpixel_edge_compensation;

fn is_valid_hex(trimmed: &str) -> bool {
    let bytes = trimmed.as_bytes();
    if bytes.first() != Some(&b'#') {
        return false;
    }
    let len = bytes.len() - 1;
    (len == 3 || len == 6) && bytes[1..].iter().all(|b| b.is_ascii_hexdigit())
}

pub fn apply_emissive_profile_to_token_hex(
    key: &str,
    hex: &str,
    profile: EmissivePanelType,
    burn_in_guard: bool,
    anti_fringing: bool,
) -> Result<String, OkyctError> {
    if !is_valid_hex(trim_ascii_whitespace(hex)) {
        return Ok(hex.to_string());
    }

    let lower_key = key.to_ascii_lowercase();
    let okyct = hex_to_okyct(hex)?;
    let spec = get_emissive_panel_spec(profile);

    let mut target_t = okyct.t;
    let mut target_c = okyct.c;

    if okyct.t <= 28.0 && (lower_key.contains("surface") || lower_key.contains("background")) {
        if lower_key.contains("lowest") {
            target_t = spec.dark_surface_tones.lowest;
        } else if lower_key.contains("low") {
            target_t = spec.dark_surface_tones.low;
        } else if lower_key.contains("highest") {
            target_t = spec.dark_surface_tones.highest;
        } else if lower_key.contains("high") {
            target_t = spec.dark_surface_tones.high;
        } else if lower_key.contains("bright") {
            target_t = spec.dark_surface_tones.bright;
        } else if lower_key.contains("container") {
            target_t = spec.dark_surface_tones.container;
        } else {
            target_t = spec.dark_surface_tones.surface;
        }
        if target_t == 0.0 {
            target_c = 0.0;
        }
    } else if okyct.t > spec.light_peak_tone_cap {
        target_t = spec.light_peak_tone_cap;
    }

    let mut out_hex = if target_t == 0.0 {
        "#000000".to_string()
    } else {
        okyct_to_hex(
            Okyct::new(okyct.h, target_c, target_t),
            ColorConversionOptions::default(),
        )?
    };

    if burn_in_guard {
        out_hex = apply_blue_burn_in_guard(&out_hex, 0.22, 3.0)?;
    }

    if anti_fringing {
        let role_kind = if lower_key.contains("on") {
            EmissiveRoleKind::Foreground
        } else if lower_key.contains("surface") {
            EmissiveRoleKind::Surface
        } else {
            EmissiveRoleKind::Accent
        };
        out_hex = apply_subpixel_edge_compensation(&out_hex, profile, role_kind)?;
    }

    Ok(out_hex)
}
