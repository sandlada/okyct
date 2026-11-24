use crate::application::audit_scheme_contrast;
use crate::domain::models::OkyctError;
use crate::domain::services::hex_to_okyct;
use crate::ports::inbound::{DynamicSchemeColors, EmissivePanelType, SystemColorToken};
use crate::ports::outbound::{ChannelPowerMw, ContrastRolePair, SchemeEmissiveReport};
use super::compute_color_emissive_telemetry::compute_color_emissive_telemetry;
use super::emissive_panel_specs::get_emissive_panel_spec;

const BACKPLANE_STATIC_MW: f64 = 95.0;
const LCD_CONSTANT_BACKLIGHT_MW: f64 = 540.0;

#[inline]
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

fn compute_min_text_wcag_contrast(
    scheme: &DynamicSchemeColors,
) -> Result<(f64, SystemColorToken, SystemColorToken), OkyctError> {
    let audits = audit_scheme_contrast(scheme)?;
    let mut lowest = None;
    for item in audits {
        if item.fg_role == SystemColorToken::Outline {
            continue;
        }
        match &lowest {
            None => lowest = Some(item),
            Some(cur) if item.wcag_ratio < cur.wcag_ratio => lowest = Some(item),
            _ => {}
        }
    }
    let lowest = lowest.unwrap();
    Ok((
        js_round(lowest.wcag_ratio * 100.0) / 100.0,
        lowest.fg_role,
        lowest.bg_role,
    ))
}

const UI_AREA_WEIGHTS: [(SystemColorToken, f64); 10] = [
    (SystemColorToken::Surface, 0.42),
    (SystemColorToken::SurfaceContainerLowest, 0.14),
    (SystemColorToken::SurfaceContainerLow, 0.12),
    (SystemColorToken::SurfaceContainer, 0.12),
    (SystemColorToken::SurfaceContainerHigh, 0.06),
    (SystemColorToken::Primary, 0.05),
    (SystemColorToken::PrimaryContainer, 0.04),
    (SystemColorToken::SecondaryContainer, 0.02),
    (SystemColorToken::OnSurface, 0.02),
    (SystemColorToken::OnSurfaceVariant, 0.01),
];

pub fn analyze_emissive_scheme_metrics(
    scheme: &DynamicSchemeColors,
    profile: EmissivePanelType,
) -> Result<SchemeEmissiveReport, OkyctError> {
    let spec = get_emissive_panel_spec(profile);

    if profile == EmissivePanelType::StandardLcd {
        let mut weighted_apl = 0.0;
        let mut weighted_blue_stress = 0.0;
        for (role, weight) in UI_AREA_WEIGHTS {
            let t = compute_color_emissive_telemetry(scheme.get(role))?;
            weighted_apl += t.apl_percent * weight;
            weighted_blue_stress += t.blue_stress_index * weight;
        }
        let (min_wcag, fg_role, bg_role) = compute_min_text_wcag_contrast(scheme)?;
        return Ok(SchemeEmissiveReport {
            profile,
            spec,
            estimated_total_power_mw: LCD_CONSTANT_BACKLIGHT_MW,
            power_savings_vs_lcd_pct: 0.0,
            channel_power_breakdown_mw: ChannelPowerMw {
                r: 180.0,
                g: 180.0,
                b: 180.0,
            },
            apl_percent: js_round(weighted_apl * 10.0) / 10.0,
            abl_trigger_risk: "Low",
            blue_subpixel_stress_index: js_round(weighted_blue_stress),
            smear_rise_time_ms: spec.smear_rise_time_ms,
            black_smear_risk: "None",
            pentile_fringing_risk: "Low",
            pixel_off_ratio_pct: 0.0,
            min_wcag_contrast_after_opt: min_wcag,
            min_wcag_contrast_pair: ContrastRolePair { fg_role, bg_role },
        });
    }

    let mut weighted_r = 0.0;
    let mut weighted_g = 0.0;
    let mut weighted_b = 0.0;
    let mut weighted_apl = 0.0;
    let mut weighted_blue_stress = 0.0;
    let mut pixel_off_area = 0.0;

    let is_wrgb = profile == EmissivePanelType::WoledDesktop;
    for (role, weight) in UI_AREA_WEIGHTS {
        let t = compute_color_emissive_telemetry(scheme.get(role))?;
        if is_wrgb {
            let w_share = t.r_linear.min(t.g_linear).min(t.b_linear);
            let rgb_max = t.r_linear.max(t.g_linear).max(t.b_linear);
            let wrgb_factor = if rgb_max > 1e-6 {
                1.0 - 0.42 * (w_share / rgb_max)
            } else {
                1.0
            };
            weighted_r += t.channel_power_mw.r * wrgb_factor * weight;
            weighted_g += t.channel_power_mw.g * wrgb_factor * weight;
            weighted_b += t.channel_power_mw.b * wrgb_factor * weight;
        } else {
            weighted_r += t.channel_power_mw.r * weight;
            weighted_g += t.channel_power_mw.g * weight;
            weighted_b += t.channel_power_mw.b * weight;
        }
        weighted_apl += t.apl_percent * weight;
        weighted_blue_stress += t.blue_stress_index * weight;
        if t.is_pixel_off {
            pixel_off_area += weight;
        }
    }

    let primary_telemetry = compute_color_emissive_telemetry(scheme.get(SystemColorToken::Primary))?;
    let effective_blue_stress =
        js_round(weighted_blue_stress * 0.55 + primary_telemetry.blue_stress_index * 0.45);

    let emissive_light_mw = weighted_r + weighted_g + weighted_b;
    let total_mw = js_round(BACKPLANE_STATIC_MW + emissive_light_mw);
    let savings_pct = js_round(((LCD_CONSTANT_BACKLIGHT_MW - total_mw) / LCD_CONSTANT_BACKLIGHT_MW) * 100.0);

    let surf_tone = scheme.tones[&SystemColorToken::Surface];
    let low_tone = scheme.tones[&SystemColorToken::SurfaceContainerLowest];
    let has_zero_cutoff = surf_tone == 0.0 || low_tone == 0.0;
    let black_smear_risk = if has_zero_cutoff {
        "Severe (T=0 Cutoff)"
    } else if surf_tone <= 2.0 {
        "Minimal"
    } else {
        "None"
    };

    let abl_trigger_risk = if weighted_apl > 65.0 {
        "High"
    } else if weighted_apl > 38.0 {
        "Moderate"
    } else {
        "Low"
    };

    let primary_okyct = hex_to_okyct(scheme.get(SystemColorToken::Primary))?;
    let pentile_fringing_risk = if profile == EmissivePanelType::AmoledAntiSmear {
        "Controlled"
    } else if primary_okyct.c > 0.17 {
        "Elevated"
    } else {
        "Low"
    };

    let (min_wcag, fg_role, bg_role) = compute_min_text_wcag_contrast(scheme)?;

    Ok(SchemeEmissiveReport {
        profile,
        spec,
        estimated_total_power_mw: total_mw,
        power_savings_vs_lcd_pct: savings_pct,
        channel_power_breakdown_mw: ChannelPowerMw {
            r: js_round(weighted_r * 10.0) / 10.0,
            g: js_round(weighted_g * 10.0) / 10.0,
            b: js_round(weighted_b * 10.0) / 10.0,
        },
        apl_percent: js_round(weighted_apl * 10.0) / 10.0,
        abl_trigger_risk,
        blue_subpixel_stress_index: effective_blue_stress,
        smear_rise_time_ms: if has_zero_cutoff { 18.5 } else { spec.smear_rise_time_ms },
        black_smear_risk,
        pentile_fringing_risk,
        pixel_off_ratio_pct: js_round(pixel_off_area * 100.0),
        min_wcag_contrast_after_opt: min_wcag,
        min_wcag_contrast_pair: ContrastRolePair { fg_role, bg_role },
    })
}
