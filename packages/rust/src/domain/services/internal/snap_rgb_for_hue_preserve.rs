use std::f64::consts::PI;
use crate::domain::models::Rgb;
use super::super::tone_y::{tone_to_y_unchecked as tone_to_y, y_to_tone_unchecked as y_to_tone};
use super::srgb_lut::srgb_byte_to_linear;

const HUE_SNAP_MIN_CHROMA_FOR_DRIFT: f64 = 0.01;
const HUE_SNAP_MIN_CHROMA_SQ: f64 = HUE_SNAP_MIN_CHROMA_FOR_DRIFT * HUE_SNAP_MIN_CHROMA_FOR_DRIFT;
const TONE_BUDGET_STANDARD: f64 = 0.25;
const TONE_BUDGET_DARK: f64 = 0.35;
const HUE_BUDGET_DEG: f64 = 0.48;
const WEIGHT_TONE: f64 = 1.0 / (0.25 * 0.25);
const WEIGHT_HUE_ARC: f64 = 1.0 / (0.0018 * 0.0018);
const WEIGHT_CHROMA: f64 = 1.0 / (0.012 * 0.012);
const DEG_TO_RAD: f64 = PI / 180.0;
const RAD_TO_DEG: f64 = 180.0 / PI;

fn byte_luminance(r8: u8, g8: u8, b8: u8) -> f64 {
    0.2126729 * srgb_byte_to_linear(r8)
        + 0.7151522 * srgb_byte_to_linear(g8)
        + 0.0721750 * srgb_byte_to_linear(b8)
}

fn byte_oklab_chroma_sq(r8: u8, g8: u8, b8: u8, y: f64) -> (f64, f64, f64) {
    let lr = srgb_byte_to_linear(r8);
    let lg = srgb_byte_to_linear(g8);
    let lb = srgb_byte_to_linear(b8);

    let x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
    let z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

    let l_ = (0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z).cbrt();
    let m_ = (0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z).cbrt();
    let s_ = (0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z).cbrt();

    let a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    let b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
    (a, b, a * a + b * b)
}

#[allow(clippy::too_many_arguments)]
fn score_from_lab(
    a: f64,
    b: f64,
    cand_c: f64,
    ref_cos: f64,
    ref_sin: f64,
    ref_chroma: f64,
    tone_err: f64,
    within_tone: bool,
    within_fallback_tone: bool,
) -> (u8, f64) {
    let mut hue_rad = 0.0;
    let mut hue_deg = 0.0;
    if cand_c > HUE_SNAP_MIN_CHROMA_FOR_DRIFT {
        let d_parallel = a * ref_cos + b * ref_sin;
        let d_perp_abs = (b * ref_cos - a * ref_sin).abs();
        hue_rad = d_perp_abs.atan2(d_parallel);
        hue_deg = hue_rad * RAD_TO_DEG;
    }
    let within_hue = hue_deg <= HUE_BUDGET_DEG;
    let tier = if within_tone && within_hue {
        3
    } else if within_fallback_tone && within_hue {
        2
    } else if within_fallback_tone {
        1
    } else {
        0
    };

    let hue_arc = cand_c * hue_rad;
    let chroma_err = cand_c - ref_chroma;
    let cost = WEIGHT_TONE * tone_err * tone_err
        + WEIGHT_HUE_ARC * hue_arc * hue_arc
        + WEIGHT_CHROMA * chroma_err * chroma_err;

    (tier, cost)
}

fn hex_from_bytes(r: u8, g: u8, b: u8) -> String {
    format!("#{r:02x}{g:02x}{b:02x}")
}

/// JS-compatible Math.round: rounds half towards +infinity (`floor(x + 0.5)`).
#[inline]
fn round_half_pos_inf(x: f64) -> u8 {
    (x + 0.5).floor().clamp(0.0, 255.0) as u8
}

pub fn snap_rgb_to_hex_for_hue_preserve(
    rgb: Rgb,
    reference_hue_deg: f64,
    nominal_tone: f64,
    nominal_chroma: Option<f64>,
) -> String {
    if nominal_tone <= 0.001 {
        return "#000000".to_string();
    }
    if nominal_tone >= 99.999 {
        return "#ffffff".to_string();
    }

    let rf = (rgb.r * 255.0).clamp(0.0, 255.0);
    let gf = (rgb.g * 255.0).clamp(0.0, 255.0);
    let bf = (rgb.b * 255.0).clamp(0.0, 255.0);

    let r_round = round_half_pos_inf(rf);
    let g_round = round_half_pos_inf(gf);
    let b_round = round_half_pos_inf(bf);

    if let Some(nc) = nominal_chroma
        && nc < HUE_SNAP_MIN_CHROMA_FOR_DRIFT
    {
        return hex_from_bytes(r_round, g_round, b_round);
    }

    let base_y = byte_luminance(r_round, g_round, b_round);
    let (base_a, base_b, base_c_sq) = byte_oklab_chroma_sq(r_round, g_round, b_round, base_y);
    let base_c = base_c_sq.sqrt();
    let ref_chroma = nominal_chroma.unwrap_or(base_c);
    if ref_chroma < HUE_SNAP_MIN_CHROMA_FOR_DRIFT && base_c < HUE_SNAP_MIN_CHROMA_FOR_DRIFT {
        return hex_from_bytes(r_round, g_round, b_round);
    }

    let r0 = (rf.floor() as u8).min(254);
    let g0 = (gf.floor() as u8).min(254);
    let b0 = (bf.floor() as u8).min(254);

    let ref_rad = reference_hue_deg * DEG_TO_RAD;
    let ref_cos = ref_rad.cos();
    let ref_sin = ref_rad.sin();

    let tone_budget = if nominal_tone < 10.0 {
        TONE_BUDGET_DARK
    } else {
        TONE_BUDGET_STANDARD
    };
    let y_min_tone = tone_to_y((nominal_tone - tone_budget - 1e-6).max(0.0));
    let y_max_tone = tone_to_y((nominal_tone + tone_budget + 1e-6).min(100.0));
    let y_min_fallback = tone_to_y((nominal_tone - TONE_BUDGET_DARK - 1e-6).max(0.0));
    let y_max_fallback = tone_to_y((nominal_tone + TONE_BUDGET_DARK + 1e-6).min(100.0));

    let base_t = y_to_tone(base_y);
    let base_tone_err = (base_t - nominal_tone).abs();
    let (mut best_tier, mut best_cost) = score_from_lab(
        base_a,
        base_b,
        base_c,
        ref_cos,
        ref_sin,
        ref_chroma,
        base_tone_err,
        base_tone_err <= tone_budget,
        base_tone_err <= TONE_BUDGET_DARK,
    );

    let mut best_r = r_round;
    let mut best_g = g_round;
    let mut best_b = b_round;

    let tan_hue_budget_safe = ((HUE_BUDGET_DEG + 1e-6) * DEG_TO_RAD).tan();
    let round_mask = ((r_round - r0) << 2) | ((g_round - g0) << 1) | (b_round - b0);

    for mask in 0u8..8u8 {
        if mask == round_mask {
            continue;
        }

        let cr = r0 + ((mask >> 2) & 1);
        let cg = g0 + ((mask >> 1) & 1);
        let cb = b0 + (mask & 1);

        let y = byte_luminance(cr, cg, cb);
        if best_tier == 3 && (y < y_min_tone || y > y_max_tone) {
            continue;
        }
        if best_tier >= 1 && (y < y_min_fallback || y > y_max_fallback) {
            continue;
        }

        let cand_t = y_to_tone(y);
        let tone_err = (cand_t - nominal_tone).abs();
        let within_tone = tone_err <= tone_budget;
        let within_fallback_tone = tone_err <= TONE_BUDGET_DARK;
        let max_possible_tier = if within_tone {
            3
        } else if within_fallback_tone {
            2
        } else {
            0
        };
        if max_possible_tier < best_tier {
            continue;
        }

        let (a, b, c_sq) = byte_oklab_chroma_sq(cr, cg, cb, y);
        if best_tier >= 2 && c_sq > HUE_SNAP_MIN_CHROMA_SQ {
            let d_parallel = a * ref_cos + b * ref_sin;
            let d_perp_abs = (b * ref_cos - a * ref_sin).abs();
            if d_parallel <= 0.0 || d_perp_abs > d_parallel * tan_hue_budget_safe {
                continue;
            }
        }

        let cand_c = c_sq.sqrt();
        let (cand_tier, cand_cost) = score_from_lab(
            a,
            b,
            cand_c,
            ref_cos,
            ref_sin,
            ref_chroma,
            tone_err,
            within_tone,
            within_fallback_tone,
        );

        if cand_tier < best_tier {
            continue;
        }
        if cand_tier > best_tier || cand_cost < best_cost {
            best_tier = cand_tier;
            best_cost = cand_cost;
            best_r = cr;
            best_g = cg;
            best_b = cb;
        }
    }

    hex_from_bytes(best_r, best_g, best_b)
}
