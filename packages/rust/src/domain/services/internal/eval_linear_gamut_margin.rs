use crate::domain::models::{GamutTarget, Rgb};
use super::solve_oklab_l_for_target_y::{
    DL_A, DL_B, DM_A, DM_B, DS_A, DS_B, YL3, YM3, YS3, solve_oklab_l_for_target_y,
};

#[derive(Debug, Clone, Copy)]
pub struct LinearGamutEvaluation {
    pub margin: f64,
    pub l: f64,
    pub linear: Rgb,
}

pub fn eval_linear_gamut_margin(
    target_y: f64,
    a: f64,
    b: f64,
    gamut: GamutTarget,
    initial_l: Option<f64>,
) -> LinearGamutEvaluation {
    if a == 0.0 && b == 0.0 {
        let y_clamped = target_y.clamp(0.0, 1.0);
        return LinearGamutEvaluation {
            margin: y_clamped.min(1.0 - y_clamped),
            l: y_clamped.cbrt(),
            linear: Rgb::new(y_clamped, y_clamped, y_clamped),
        };
    }

    let l = solve_oklab_l_for_target_y(target_y, a, b, initial_l);
    let l_ = l + DL_A * a + DL_B * b;
    let m_ = l + DM_A * a + DM_B * b;
    let s_ = l + DS_A * a + DS_B * b;
    let l3 = l_ * l_ * l_;
    let m3 = m_ * m_ * m_;
    let s3 = s_ * s_ * s_;

    let x = 1.2270138511 * l3 - 0.5577999807 * m3 + 0.2812561490 * s3;
    let y = YL3 * l3 + YM3 * m3 + YS3 * s3;
    let z = -0.0763812845 * l3 - 0.4214819784 * m3 + 1.5861632204 * s3;

    let (r, g, b_lin) = match gamut {
        GamutTarget::DisplayP3 => (
            2.4934969 * x - 0.9313836 * y - 0.4027108 * z,
            -0.8294890 * x + 1.7626641 * y + 0.0236247 * z,
            0.0358458 * x - 0.0761724 * y + 0.9568845 * z,
        ),
        GamutTarget::Srgb => (
            3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
            -0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
            0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
        ),
    };

    let margin = r
        .min(g)
        .min(b_lin)
        .min(1.0 - r)
        .min(1.0 - g)
        .min(1.0 - b_lin);

    LinearGamutEvaluation {
        margin,
        l,
        linear: Rgb::new(r, g, b_lin),
    }
}
