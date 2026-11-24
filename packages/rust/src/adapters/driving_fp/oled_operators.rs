use crate::domain::models::OkyctError;
use crate::domain::services::trim_ascii_whitespace;
use crate::ports::inbound::EmissivePanelType;
use crate::ports::outbound::EmitterState;
use super::super::driven_emissive_oled::{
    apply_blue_burn_in_guard, apply_emissive_profile_to_token_hex, compute_color_emissive_telemetry,
};
use super::token_dictionary::TokenDictionary;

#[derive(Debug, Clone, PartialEq)]
pub struct OledPowerAuditReport {
    pub passed: bool,
    pub average_power_mw: f64,
    pub average_apl_percent: f64,
    pub max_blue_stress_token: String,
    pub max_blue_stress_index: f64,
    pub true_black_token_count: usize,
    pub near_black_token_count: usize,
    pub total_tokens_evaluated: usize,
}

#[inline]
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

fn is_valid_hex(trimmed: &str) -> bool {
    let bytes = trimmed.as_bytes();
    if bytes.first() != Some(&b'#') {
        return false;
    }
    let len = bytes.len() - 1;
    (len == 3 || len == 6) && bytes[1..].iter().all(|b| b.is_ascii_hexdigit())
}

pub fn optimize_for_oled(
    profile: EmissivePanelType,
    burn_in_guard: bool,
    anti_fringing: bool,
    dict: &TokenDictionary,
) -> Result<TokenDictionary, OkyctError> {
    let mut result = TokenDictionary::new();
    for (k, v) in dict.iter() {
        let next = apply_emissive_profile_to_token_hex(k, v, profile, burn_in_guard, anti_fringing)?;
        result.insert(k.to_string(), next);
    }
    Ok(result)
}

pub fn limit_blue_emission(
    max_blue_attenuation: f64,
    hue_shift_deg: f64,
    color_hex: &str,
) -> Result<String, OkyctError> {
    apply_blue_burn_in_guard(color_hex, max_blue_attenuation, hue_shift_deg)
}

pub fn audit_oled_power(
    max_avg_power_mw: f64,
    max_blue_stress: f64,
    dict: &TokenDictionary,
) -> Result<OledPowerAuditReport, OkyctError> {
    if !max_avg_power_mw.is_finite() || max_avg_power_mw < 0.0 {
        return Err(OkyctError::new(format!(
            "Invalid maxAvgPowerMw threshold: {max_avg_power_mw}. Expected a non-negative finite number."
        )));
    }
    if !max_blue_stress.is_finite() || max_blue_stress < 0.0 {
        return Err(OkyctError::new(format!(
            "Invalid maxBlueStress threshold: {max_blue_stress}. Expected a non-negative finite number."
        )));
    }

    let entries: Vec<(&str, &str)> = dict
        .iter()
        .filter(|(_, v)| is_valid_hex(trim_ascii_whitespace(v)))
        .collect();

    if entries.is_empty() {
        return Ok(OledPowerAuditReport {
            passed: true,
            average_power_mw: 0.0,
            average_apl_percent: 0.0,
            max_blue_stress_token: "none".to_string(),
            max_blue_stress_index: 0.0,
            true_black_token_count: 0,
            near_black_token_count: 0,
            total_tokens_evaluated: 0,
        });
    }

    let mut sum_power = 0.0;
    let mut sum_apl = 0.0;
    let mut max_blue = -1.0;
    let mut max_blue_key = entries[0].0.to_string();
    let mut true_black_count = 0;
    let mut near_black_count = 0;

    for &(k, hex) in &entries {
        let t = compute_color_emissive_telemetry(hex)?;
        sum_power += t.power_mw;
        sum_apl += t.apl_percent;
        if t.is_pixel_off {
            true_black_count += 1;
        } else if t.emitter_state == EmitterState::NearBlack {
            near_black_count += 1;
        }
        if t.blue_stress_index > max_blue {
            max_blue = t.blue_stress_index;
            max_blue_key = k.to_string();
        }
    }

    let len_f = entries.len() as f64;
    let avg_power = js_round((sum_power / len_f) * 10.0) / 10.0;
    let avg_apl = js_round((sum_apl / len_f) * 10.0) / 10.0;

    Ok(OledPowerAuditReport {
        passed: avg_power <= max_avg_power_mw && max_blue <= max_blue_stress,
        average_power_mw: avg_power,
        average_apl_percent: avg_apl,
        max_blue_stress_token: max_blue_key,
        max_blue_stress_index: max_blue,
        true_black_token_count: true_black_count,
        near_black_token_count: near_black_count,
        total_tokens_evaluated: entries.len(),
    })
}
