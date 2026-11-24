use crate::domain::models::OkyctError;
use crate::domain::services::{hex_to_rgb, srgb_to_linear};
use crate::ports::outbound::{ChannelPowerMw, ColorEmissiveTelemetry, EmitterState};

const WEIGHT_R: f64 = 1.05;
const WEIGHT_G: f64 = 0.85;
const WEIGHT_B: f64 = 2.40;
const WEIGHT_SUM: f64 = WEIGHT_R + WEIGHT_G + WEIGHT_B;
const FULL_WHITE_OLED_MW: f64 = 1000.0;
const NEAR_BLACK_LINEAR_THRESHOLD: f64 = 0.0005;

#[inline]
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

pub fn compute_color_emissive_telemetry(hex: &str) -> Result<ColorEmissiveTelemetry, OkyctError> {
    let rgb = hex_to_rgb(hex)?;
    let r_lin = srgb_to_linear(rgb.r)?;
    let g_lin = srgb_to_linear(rgb.g)?;
    let b_lin = srgb_to_linear(rgb.b)?;

    let is_pixel_off = rgb.r == 0.0 && rgb.g == 0.0 && rgb.b == 0.0;
    let is_near_black = !is_pixel_off
        && r_lin < NEAR_BLACK_LINEAR_THRESHOLD
        && g_lin < NEAR_BLACK_LINEAR_THRESHOLD
        && b_lin < NEAR_BLACK_LINEAR_THRESHOLD;
    let emitter_state = if is_pixel_off {
        EmitterState::Off
    } else if is_near_black {
        EmitterState::NearBlack
    } else {
        EmitterState::Active
    };

    let gamma_drive = 1.08;
    let r_drive = if r_lin == 0.0 { 0.0 } else { r_lin.powf(gamma_drive) };
    let g_drive = if g_lin == 0.0 { 0.0 } else { g_lin.powf(gamma_drive) };
    let b_drive = if b_lin == 0.0 { 0.0 } else { b_lin.powf(gamma_drive) };

    let r_mw = (r_drive * WEIGHT_R / WEIGHT_SUM) * FULL_WHITE_OLED_MW;
    let g_mw = (g_drive * WEIGHT_G / WEIGHT_SUM) * FULL_WHITE_OLED_MW;
    let b_mw = (b_drive * WEIGHT_B / WEIGHT_SUM) * FULL_WHITE_OLED_MW;

    let power_mw = r_mw + g_mw + b_mw;
    let apl_percent = (0.2126729 * r_lin + 0.7151522 * g_lin + 0.0721750 * b_lin) * 100.0;

    let mean_other = (r_drive + g_drive) * 0.5;
    let blue_asymmetry = (b_drive - mean_other * 0.6).max(0.0);
    let blue_stress_index = js_round((b_drive * 0.65 + blue_asymmetry * 0.55) * 100.0).min(100.0);

    Ok(ColorEmissiveTelemetry {
        hex: hex.to_string(),
        r_linear: r_lin,
        g_linear: g_lin,
        b_linear: b_lin,
        power_mw: js_round(power_mw * 10.0) / 10.0,
        channel_power_mw: ChannelPowerMw {
            r: js_round(r_mw * 10.0) / 10.0,
            g: js_round(g_mw * 10.0) / 10.0,
            b: js_round(b_mw * 10.0) / 10.0,
        },
        apl_percent: js_round(apl_percent * 10.0) / 10.0,
        blue_stress_index,
        is_pixel_off,
        emitter_state,
    })
}
