use std::f64::consts::PI;
use crate::domain::models::{GamutTarget, Rgb};
use super::super::tone_y::tone_to_y_unchecked as tone_to_y;
use super::eval_linear_gamut_margin::eval_linear_gamut_margin;
use super::find_cusp_for_max_chroma::find_cusp_for_max_chroma;

const CUSP_ANCHOR_PULL: f64 = 0.65;

pub fn compress_to_gamut_cusp(h: f64, c: f64, t: f64, gamut: GamutTarget) -> Rgb {
    let cusp = find_cusp_for_max_chroma(h, gamut);
    let t_anchor = (t + (cusp.tone - t) * CUSP_ANCHOR_PULL).clamp(0.5, 99.5);
    let rad = h * PI / 180.0;
    let cos_h = rad.cos();
    let sin_h = rad.sin();

    let mut lo = 0.0;
    let mut hi = 1.0;
    let mut last_l = None;
    let y_anchor = tone_to_y(t_anchor);
    let mut best_linear = Rgb::new(y_anchor, y_anchor, y_anchor);

    for _ in 0..16 {
        if hi - lo < 1e-5 {
            break;
        }
        let mid = (lo + hi) * 0.5;
        let t_mid = t_anchor + mid * (t - t_anchor);
        let c_mid = mid * c;
        let target_y = tone_to_y(t_mid);
        let ev = eval_linear_gamut_margin(target_y, c_mid * cos_h, c_mid * sin_h, gamut, last_l);
        if ev.margin >= -1e-6 {
            lo = mid;
            last_l = Some(ev.l);
            best_linear = ev.linear;
        } else {
            hi = mid;
        }
    }

    best_linear
}
