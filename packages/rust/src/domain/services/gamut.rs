use std::f64::consts::PI;
use crate::domain::models::{GamutCheckResult, GamutCusp, GamutTarget, Okyct, OkyctError, Rgb};
use super::internal::eval_linear_gamut_margin::eval_linear_gamut_margin;
use super::internal::find_cusp_for_max_chroma::find_cusp_for_max_chroma;
use super::srgb_to_linear::linear_to_srgb;
use super::tone_y::tone_to_y;

const GAMUT_TOLERANCE: f64 = 1e-5;
const GAMUT_SEARCH_MARGIN_TOLERANCE: f64 = 1e-6;

pub fn is_in_gamut(okyct: Okyct, gamut: GamutTarget) -> Result<GamutCheckResult, OkyctError> {
    let Okyct { h, c, t } = okyct;
    if !h.is_finite() || !c.is_finite() || !t.is_finite() || c < 0.0 || !(0.0..=100.0).contains(&t) {
        return Err(OkyctError::new(format!(
            "Invalid OKYCT coordinates for gamut check: h={h}, c={c}, t={t}. Expected finite h, c >= 0, and t in [0, 100]."
        )));
    }

    if t <= 0.001 && c <= GAMUT_TOLERANCE {
        return Ok(GamutCheckResult {
            in_gamut: true,
            rgb: Rgb::new(0.0, 0.0, 0.0),
        });
    }
    if t >= 99.999 && c <= GAMUT_TOLERANCE {
        return Ok(GamutCheckResult {
            in_gamut: true,
            rgb: Rgb::new(1.0, 1.0, 1.0),
        });
    }

    let target_y = tone_to_y(t)?;
    let rad = h * PI / 180.0;
    let a = c * rad.cos();
    let b = c * rad.sin();

    let ev = eval_linear_gamut_margin(target_y, a, b, gamut, None);
    let rgb = Rgb::new(
        linear_to_srgb(ev.linear.r)?,
        linear_to_srgb(ev.linear.g)?,
        linear_to_srgb(ev.linear.b)?,
    );

    Ok(GamutCheckResult {
        in_gamut: ev.margin >= -GAMUT_TOLERANCE,
        rgb,
    })
}

pub fn is_in_srgb_gamut(okyct: Okyct) -> Result<GamutCheckResult, OkyctError> {
    is_in_gamut(okyct, GamutTarget::Srgb)
}

pub fn find_gamut_cusp(hue: f64, gamut: GamutTarget) -> Result<GamutCusp, OkyctError> {
    if !hue.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid hue: {hue}. Expected a finite number."
        )));
    }
    Ok(find_cusp_for_max_chroma(hue, gamut))
}

pub fn find_max_chroma_for_tone(h: f64, t: f64, gamut: GamutTarget) -> Result<f64, OkyctError> {
    if !h.is_finite() || !t.is_finite() || !(0.0..=100.0).contains(&t) {
        return Err(OkyctError::new(format!(
            "Invalid hue/tone coordinates: h={h}, t={t}. Expected finite h and t in [0, 100]."
        )));
    }
    if t <= 0.001 || t >= 99.999 {
        return Ok(0.0);
    }

    let target_y = tone_to_y(t)?;
    let rad = h * PI / 180.0;
    let cos_h = rad.cos();
    let sin_h = rad.sin();

    let mut low = 0.0;
    let mut high = if gamut == GamutTarget::DisplayP3 {
        0.50
    } else {
        0.38
    };
    let mut last_l = target_y.cbrt();
    let mut f_low = target_y.min(1.0 - target_y);
    let mut f_high = f64::NAN;

    for _ in 0..6 {
        let mid = (low + high) * 0.5;
        let ev = eval_linear_gamut_margin(target_y, mid * cos_h, mid * sin_h, gamut, Some(last_l));
        if ev.margin >= -GAMUT_SEARCH_MARGIN_TOLERANCE {
            low = mid;
            f_low = ev.margin;
            last_l = ev.l;
        } else {
            high = mid;
            f_high = ev.margin;
        }
    }

    if f_high.is_nan() {
        f_high = eval_linear_gamut_margin(target_y, high * cos_h, high * sin_h, gamut, Some(last_l))
            .margin;
    }

    let mut side = 0;
    for _ in 0..8 {
        if high - low < 1e-6 {
            break;
        }
        let denom = f_high - f_low;
        let mut x = if denom.abs() > 1e-12 {
            (low * f_high - high * f_low) / denom
        } else {
            (low + high) * 0.5
        };
        if !(x > low && x < high) {
            x = (low + high) * 0.5;
        }

        let ev = eval_linear_gamut_margin(target_y, x * cos_h, x * sin_h, gamut, Some(last_l));
        if ev.margin.abs() <= GAMUT_SEARCH_MARGIN_TOLERANCE {
            low = x;
            break;
        }
        if ev.margin > 0.0 {
            low = x;
            f_low = ev.margin;
            last_l = ev.l;
            if side == -1 {
                f_high *= 0.5;
            }
            side = -1;
        } else {
            high = x;
            f_high = ev.margin;
            if side == 1 {
                f_low *= 0.5;
            }
            side = 1;
        }
    }

    Ok(low)
}
