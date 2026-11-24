use std::f64::consts::PI;
use crate::domain::models::{ColorConversionOptions, Okyct, OkyctError};
use crate::domain::services::{hex_to_okyct, okyct_to_hex, shortest_hue_delta};

const BLUE_HAZARD_CENTER_HUE: f64 = 265.0;
const BLUE_HAZARD_HALF_WINDOW_DEG: f64 = 42.0;

pub fn apply_blue_burn_in_guard(
    hex: &str,
    max_blue_attenuation: f64,
    hue_shift_deg: f64,
) -> Result<String, OkyctError> {
    if !max_blue_attenuation.is_finite() || !(0.0..=1.0).contains(&max_blue_attenuation) {
        return Err(OkyctError::new(format!(
            "Invalid maxBlueAttenuation: {max_blue_attenuation}. Expected a finite number in [0, 1]."
        )));
    }
    if !hue_shift_deg.is_finite() || hue_shift_deg < 0.0 {
        return Err(OkyctError::new(format!(
            "Invalid hueShiftDeg: {hue_shift_deg}. Expected a non-negative finite number."
        )));
    }

    let okyct = hex_to_okyct(hex)?;
    if okyct.c < 0.025 {
        return Ok(hex.to_string());
    }

    let angular_dist = shortest_hue_delta(okyct.h, BLUE_HAZARD_CENTER_HUE)?;
    if angular_dist >= BLUE_HAZARD_HALF_WINDOW_DEG {
        return Ok(hex.to_string());
    }

    let weight = 0.5 * (1.0 + ((angular_dist / BLUE_HAZARD_HALF_WINDOW_DEG) * PI).cos());
    let new_chroma = okyct.c * (1.0 - max_blue_attenuation * weight);
    let new_hue = (okyct.h - hue_shift_deg * weight).rem_euclid(360.0);

    okyct_to_hex(
        Okyct::new(new_hue, new_chroma, okyct.t),
        ColorConversionOptions::default(),
    )
}
