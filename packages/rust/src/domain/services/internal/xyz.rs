use crate::domain::models::Rgb;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Xyz {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Oklab {
    pub l: f64,
    pub a: f64,
    pub b: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Cielab {
    pub l: f64,
    pub a: f64,
    pub b: f64,
}

#[inline]
pub fn linear_rgb_to_xyz(rgb: Rgb) -> Xyz {
    Xyz {
        x: 0.4124564 * rgb.r + 0.3575761 * rgb.g + 0.1804375 * rgb.b,
        y: 0.2126729 * rgb.r + 0.7151522 * rgb.g + 0.0721750 * rgb.b,
        z: 0.0193339 * rgb.r + 0.1191920 * rgb.g + 0.9503041 * rgb.b,
    }
}

#[inline]
pub fn linear_p3_to_xyz(rgb: Rgb) -> Xyz {
    Xyz {
        x: 0.4865710 * rgb.r + 0.2656677 * rgb.g + 0.1982173 * rgb.b,
        y: 0.2289746 * rgb.r + 0.6917385 * rgb.g + 0.0792869 * rgb.b,
        z: 0.0451134 * rgb.g + 1.0439444 * rgb.b,
    }
}

#[inline]
pub fn xyz_to_oklab(xyz: Xyz) -> Oklab {
    let l = 0.8189330101 * xyz.x + 0.3618667424 * xyz.y - 0.1288597137 * xyz.z;
    let m = 0.0329845436 * xyz.x + 0.9293118715 * xyz.y + 0.0361456387 * xyz.z;
    let s = 0.0482003018 * xyz.x + 0.2643662691 * xyz.y + 0.6338517070 * xyz.z;

    let l_ = l.cbrt();
    let m_ = m.cbrt();
    let s_ = s.cbrt();

    Oklab {
        l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    }
}

const D65_XN: f64 = 0.95047;
const D65_YN: f64 = 1.0;
const D65_ZN: f64 = 1.08883;
const CIE_EPSILON: f64 = 216.0 / 24389.0;
const CIE_KAPPA: f64 = 24389.0 / 27.0;

#[inline]
fn lab_f(t: f64) -> f64 {
    if t > CIE_EPSILON {
        t.cbrt()
    } else {
        (CIE_KAPPA * t + 16.0) / 116.0
    }
}

#[inline]
pub fn xyz_to_cielab(xyz: Xyz) -> Cielab {
    let fx = lab_f(xyz.x / D65_XN);
    let fy = lab_f(xyz.y / D65_YN);
    let fz = lab_f(xyz.z / D65_ZN);

    Cielab {
        l: 116.0 * fy - 16.0,
        a: 500.0 * (fx - fy),
        b: 200.0 * (fy - fz),
    }
}
