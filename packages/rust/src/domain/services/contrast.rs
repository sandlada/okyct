use crate::domain::models::{
    ColorToneInput, ContrastMetric, ContrastSolution, ContrastSolveOptions, OkyctError,
};
use super::internal::resolve_tone_input::resolve_tone_input;
use super::tone_y::{tone_to_y, y_to_tone};

const APCA_BLK_THRS: f64 = 0.022;
const APCA_BLK_CLMP: f64 = 1.414;
const APCA_DELTA_Y_MIN: f64 = 0.0005;
const APCA_LO_CLIP: f64 = 0.1;
const APCA_LO_CON_OFFSET: f64 = 0.027;
const APCA_SCALE: f64 = 1.14;
const APCA_TONE_MARGIN: f64 = 0.35;
const QUANTIZATION_TONE_MARGIN: f64 = 0.35;

pub fn get_contrast_ratio(
    tone_or_color_a: ColorToneInput<'_>,
    tone_or_color_b: ColorToneInput<'_>,
) -> Result<f64, OkyctError> {
    let y_a = tone_to_y(resolve_tone_input(tone_or_color_a)?)?;
    let y_b = tone_to_y(resolve_tone_input(tone_or_color_b)?)?;
    let lighter = y_a.max(y_b);
    let darker = y_a.min(y_b);
    Ok((lighter + 0.05) / (darker + 0.05))
}

#[inline]
fn js_math_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

pub fn get_apca_contrast(
    txt_tone_or_color: ColorToneInput<'_>,
    bg_tone_or_color: ColorToneInput<'_>,
) -> Result<f64, OkyctError> {
    let mut txt_y = tone_to_y(resolve_tone_input(txt_tone_or_color)?)?;
    let mut bg_y = tone_to_y(resolve_tone_input(bg_tone_or_color)?)?;

    if txt_y < APCA_BLK_THRS {
        txt_y += (APCA_BLK_THRS - txt_y).powf(APCA_BLK_CLMP);
    }
    if bg_y < APCA_BLK_THRS {
        bg_y += (APCA_BLK_THRS - bg_y).powf(APCA_BLK_CLMP);
    }

    if (bg_y - txt_y).abs() < APCA_DELTA_Y_MIN {
        return Ok(0.0);
    }

    if bg_y > txt_y {
        let sapc = (bg_y.powf(0.56) - txt_y.powf(0.57)) * APCA_SCALE;
        if sapc < APCA_LO_CLIP {
            return Ok(0.0);
        }
        Ok(js_math_round((sapc - APCA_LO_CON_OFFSET) * 100.0))
    } else {
        let sapc = (bg_y.powf(0.65) - txt_y.powf(0.62)) * APCA_SCALE;
        if sapc > -APCA_LO_CLIP {
            return Ok(0.0);
        }
        Ok(js_math_round((sapc + APCA_LO_CON_OFFSET) * 100.0))
    }
}

#[inline]
fn soft_clamp_y(y: f64) -> f64 {
    if y < APCA_BLK_THRS {
        y + (APCA_BLK_THRS - y).powf(APCA_BLK_CLMP)
    } else {
        y
    }
}

fn invert_soft_clamp_y(y_soft: f64) -> f64 {
    let min_floor_y = APCA_BLK_THRS.powf(APCA_BLK_CLMP);
    if y_soft >= APCA_BLK_THRS {
        return y_soft;
    }
    if y_soft <= min_floor_y {
        return 0.0;
    }

    let mut y = (y_soft * 0.7).clamp(0.0, APCA_BLK_THRS);
    for _ in 0..6 {
        let f = y + (APCA_BLK_THRS - y).powf(APCA_BLK_CLMP) - y_soft;
        if f.abs() < 1e-12 {
            break;
        }
        let df = 1.0 - APCA_BLK_CLMP * (APCA_BLK_THRS - y).powf(APCA_BLK_CLMP - 1.0);
        y = (y - f / df).clamp(0.0, APCA_BLK_THRS);
    }
    y
}

pub fn solve_tones_for_apca(
    bg_tone_or_color: ColorToneInput<'_>,
    target_lc: f64,
) -> Result<ContrastSolution, OkyctError> {
    let bg_tone = resolve_tone_input(bg_tone_or_color)?;
    if !target_lc.is_finite() || !(0.0..=108.0).contains(&target_lc) {
        return Err(OkyctError::new(format!(
            "Invalid targetLc: {target_lc}. Expected a finite number in [0, 108]."
        )));
    }
    if target_lc == 0.0 {
        return Ok(ContrastSolution {
            dark_foreground_tone: Some(bg_tone.floor()),
            light_foreground_tone: Some(bg_tone.ceil()),
        });
    }

    let bg_y_soft = soft_clamp_y(tone_to_y(bg_tone)?);
    let sapc_required = APCA_LO_CLIP.max(target_lc / 100.0 + APCA_LO_CON_OFFSET);

    let mut dark_tone = None;
    let dark_term = bg_y_soft.powf(0.56) - sapc_required / APCA_SCALE;
    let mut dark_candidate = 0.0;
    let mut dark_lc;
    if dark_term >= 0.0 {
        let txt_y_soft = dark_term.powf(1.0 / 0.57);
        let raw_y = invert_soft_clamp_y(txt_y_soft);
        dark_candidate = (y_to_tone(raw_y)? - APCA_TONE_MARGIN).floor().max(0.0);
        dark_lc = get_apca_contrast(ColorToneInput::Tone(dark_candidate), ColorToneInput::Tone(bg_tone))?.abs();
        while dark_candidate > 0.0 && dark_lc < target_lc {
            dark_candidate -= 1.0;
            dark_lc = get_apca_contrast(ColorToneInput::Tone(dark_candidate), ColorToneInput::Tone(bg_tone))?.abs();
        }
    } else {
        dark_lc = get_apca_contrast(ColorToneInput::Tone(0.0), ColorToneInput::Tone(bg_tone))?.abs();
    }
    if dark_lc >= target_lc {
        dark_tone = Some(dark_candidate);
    }

    let mut light_tone = None;
    let light_term = bg_y_soft.powf(0.65) + sapc_required / APCA_SCALE;
    let mut light_candidate = 100.0;
    let mut light_lc;
    if light_term <= 1.0 {
        let txt_y_soft = light_term.max(0.0).powf(1.0 / 0.62).min(1.0);
        let raw_y = invert_soft_clamp_y(txt_y_soft);
        light_candidate = (y_to_tone(raw_y)? + APCA_TONE_MARGIN).ceil().min(100.0);
        light_lc = get_apca_contrast(ColorToneInput::Tone(light_candidate), ColorToneInput::Tone(bg_tone))?.abs();
        while light_candidate < 100.0 && light_lc < target_lc {
            light_candidate += 1.0;
            light_lc = get_apca_contrast(ColorToneInput::Tone(light_candidate), ColorToneInput::Tone(bg_tone))?.abs();
        }
    } else {
        light_lc = get_apca_contrast(ColorToneInput::Tone(100.0), ColorToneInput::Tone(bg_tone))?.abs();
    }
    if light_lc >= target_lc {
        light_tone = Some(light_candidate);
    }

    Ok(ContrastSolution {
        dark_foreground_tone: dark_tone,
        light_foreground_tone: light_tone,
    })
}

fn solve_wcag_only(bg_tone: f64, target_ratio: f64) -> Result<ContrastSolution, OkyctError> {
    let bg_y = tone_to_y(bg_tone)?;

    let dark_target_y = (bg_y + 0.05) / target_ratio - 0.05;
    let dark_tone = if dark_target_y >= -1e-12 {
        Some((y_to_tone(dark_target_y.max(0.0))? - QUANTIZATION_TONE_MARGIN).floor().max(0.0))
    } else {
        None
    };

    let light_target_y = target_ratio * (bg_y + 0.05) - 0.05;
    let light_tone = if light_target_y <= 1.0 + 1e-12 {
        Some((y_to_tone(light_target_y.min(1.0))? + QUANTIZATION_TONE_MARGIN).ceil().min(100.0))
    } else {
        None
    };

    Ok(ContrastSolution {
        dark_foreground_tone: dark_tone,
        light_foreground_tone: light_tone,
    })
}

pub fn solve_tones_for_contrast(
    bg_tone_or_color: ColorToneInput<'_>,
    target_ratio: f64,
    options: ContrastSolveOptions,
) -> Result<ContrastSolution, OkyctError> {
    let bg_tone = resolve_tone_input(bg_tone_or_color)?;
    if !target_ratio.is_finite() || !(1.0..=21.0).contains(&target_ratio) {
        return Err(OkyctError::new(format!(
            "Invalid targetRatio: {target_ratio}. Expected a finite number in [1, 21]."
        )));
    }

    let target_lc = options.target_lc.unwrap_or(if target_ratio >= 7.0 {
        75.0
    } else if target_ratio >= 4.5 {
        60.0
    } else {
        45.0
    });

    match options.metric {
        ContrastMetric::Wcag => solve_wcag_only(bg_tone, target_ratio),
        ContrastMetric::Apca => solve_tones_for_apca(ColorToneInput::Tone(bg_tone), target_lc),
        ContrastMetric::Both => {
            let wcag = solve_wcag_only(bg_tone, target_ratio)?;
            let apca = solve_tones_for_apca(ColorToneInput::Tone(bg_tone), target_lc)?;
            let dark_foreground_tone = match (wcag.dark_foreground_tone, apca.dark_foreground_tone) {
                (Some(w), Some(a)) => Some(w.min(a)),
                _ => None,
            };
            let light_foreground_tone = match (wcag.light_foreground_tone, apca.light_foreground_tone) {
                (Some(w), Some(a)) => Some(w.max(a)),
                _ => None,
            };
            Ok(ContrastSolution {
                dark_foreground_tone,
                light_foreground_tone,
            })
        }
    }
}
