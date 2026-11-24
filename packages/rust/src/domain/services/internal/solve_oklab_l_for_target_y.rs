pub const DL_A: f64 = 0.3963377774;
pub const DL_B: f64 = 0.2158037573;
pub const DM_A: f64 = -0.1055613458;
pub const DM_B: f64 = -0.0638541728;
pub const DS_A: f64 = -0.0894841775;
pub const DS_B: f64 = -1.2914855480;
pub const YL3: f64 = -0.0405801784;
pub const YM3: f64 = 1.1122568696;
pub const YS3: f64 = -0.0716766787;
pub const D1L2: f64 = -0.1217405352;
pub const D1M2: f64 = 3.3367706088;
pub const D1S2: f64 = -0.2150300361;
pub const D2L1: f64 = -0.2434810704;
pub const D2M1: f64 = 6.6735412176;
pub const D2S1: f64 = -0.4300600722;

pub fn solve_oklab_l_for_target_y(target_y: f64, a: f64, b: f64, initial_l: Option<f64>) -> f64 {
    if target_y <= 0.0 {
        return 0.0;
    }
    if target_y >= 1.0 {
        return 1.0;
    }
    if a == 0.0 && b == 0.0 {
        return target_y.cbrt();
    }

    let dl = DL_A * a + DL_B * b;
    let dm = DM_A * a + DM_B * b;
    let ds = DS_A * a + DS_B * b;

    let mut l = match initial_l {
        Some(v) if v.is_finite() => v,
        _ => target_y.cbrt(),
    };

    for _ in 0..10 {
        let l_ = l + dl;
        let m_ = l + dm;
        let s_ = l + ds;

        let l2 = l_ * l_;
        let m2 = m_ * m_;
        let s2 = s_ * s_;

        let current_y = YL3 * l2 * l_ + YM3 * m2 * m_ + YS3 * s2 * s_;
        let f = current_y - target_y;
        if f.abs() < 1e-12 {
            break;
        }

        let d1 = D1L2 * l2 + D1M2 * m2 + D1S2 * s2;
        if d1.abs() < 1e-12 {
            break;
        }

        let d2 = D2L1 * l_ + D2M1 * m_ + D2S1 * s_;
        let denom = 2.0 * d1 * d1 - f * d2;
        if denom.abs() < 1e-15 {
            l -= f / d1;
        } else {
            l -= (2.0 * f * d1) / denom;
        }
        l = l.clamp(0.0, 1.0);
    }

    l
}
