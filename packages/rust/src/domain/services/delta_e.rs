use std::f64::consts::PI;
use crate::domain::models::{OkyctError, Rgb};
use super::internal::srgb_lut::{parse_hex_to_rgb24, srgb_byte_to_linear};
use super::internal::xyz::{Cielab, Oklab, linear_rgb_to_xyz, xyz_to_cielab, xyz_to_oklab};

const DEG_TO_RAD: f64 = PI / 180.0;
const RAD_TO_DEG: f64 = 180.0 / PI;
const TWENTY_FIVE_POW_7: f64 = 6_103_515_625.0;

#[inline]
fn pow7(x: f64) -> f64 {
    let x2 = x * x;
    let x4 = x2 * x2;
    x4 * x2 * x
}

fn rgb24_to_linear(rgb24: u32) -> Rgb {
    Rgb::new(
        srgb_byte_to_linear(((rgb24 >> 16) & 255) as u8),
        srgb_byte_to_linear(((rgb24 >> 8) & 255) as u8),
        srgb_byte_to_linear((rgb24 & 255) as u8),
    )
}

fn rgb24_to_oklab(rgb24: u32) -> Oklab {
    xyz_to_oklab(linear_rgb_to_xyz(rgb24_to_linear(rgb24)))
}

fn rgb24_to_cielab(rgb24: u32) -> Cielab {
    xyz_to_cielab(linear_rgb_to_xyz(rgb24_to_linear(rgb24)))
}

fn hue_angle_deg(b: f64, a_prime: f64) -> f64 {
    if a_prime == 0.0 && b == 0.0 {
        return 0.0;
    }
    let deg = b.atan2(a_prime) * RAD_TO_DEG;
    if deg >= 0.0 { deg } else { deg + 360.0 }
}

pub fn get_delta_e_oklab(hex_a: &str, hex_b: &str) -> Result<f64, OkyctError> {
    let rgb24_a = parse_hex_to_rgb24(hex_a)?;
    let rgb24_b = parse_hex_to_rgb24(hex_b)?;
    if rgb24_a == rgb24_b {
        return Ok(0.0);
    }
    let lab_a = rgb24_to_oklab(rgb24_a);
    let lab_b = rgb24_to_oklab(rgb24_b);
    let dl = lab_b.l - lab_a.l;
    let da = lab_b.a - lab_a.a;
    let db = lab_b.b - lab_a.b;
    Ok((dl * dl + da * da + db * db).sqrt())
}

pub fn get_delta_e_2000(hex_a: &str, hex_b: &str) -> Result<f64, OkyctError> {
    let rgb24_a = parse_hex_to_rgb24(hex_a)?;
    let rgb24_b = parse_hex_to_rgb24(hex_b)?;
    if rgb24_a == rgb24_b {
        return Ok(0.0);
    }

    let lab1 = rgb24_to_cielab(rgb24_a);
    let lab2 = rgb24_to_cielab(rgb24_b);

    let c1 = lab1.a.hypot(lab1.b);
    let c2 = lab2.a.hypot(lab2.b);
    let c_bar = (c1 + c2) * 0.5;
    let c_bar_7 = pow7(c_bar);
    let g = 0.5 * (1.0 - (c_bar_7 / (c_bar_7 + TWENTY_FIVE_POW_7)).sqrt());

    let a1_prime = (1.0 + g) * lab1.a;
    let a2_prime = (1.0 + g) * lab2.a;
    let c1_prime = a1_prime.hypot(lab1.b);
    let c2_prime = a2_prime.hypot(lab2.b);

    let h1_prime = hue_angle_deg(lab1.b, a1_prime);
    let h2_prime = hue_angle_deg(lab2.b, a2_prime);

    let delta_l_prime = lab2.l - lab1.l;
    let delta_c_prime = c2_prime - c1_prime;

    let mut delta_h_small = 0.0;
    if c1_prime * c2_prime != 0.0 {
        let diff = h2_prime - h1_prime;
        if diff.abs() <= 180.0 {
            delta_h_small = diff;
        } else if diff > 180.0 {
            delta_h_small = diff - 360.0;
        } else {
            delta_h_small = diff + 360.0;
        }
    }

    let delta_h_prime =
        2.0 * (c1_prime * c2_prime).sqrt() * ((delta_h_small * 0.5) * DEG_TO_RAD).sin();

    let l_bar_prime = (lab1.l + lab2.l) * 0.5;
    let c_bar_prime = (c1_prime + c2_prime) * 0.5;

    let mut h_bar_prime = h1_prime + h2_prime;
    if c1_prime * c2_prime != 0.0 {
        if (h1_prime - h2_prime).abs() <= 180.0 {
            h_bar_prime = (h1_prime + h2_prime) * 0.5;
        } else if h1_prime + h2_prime < 360.0 {
            h_bar_prime = (h1_prime + h2_prime + 360.0) * 0.5;
        } else {
            h_bar_prime = (h1_prime + h2_prime - 360.0) * 0.5;
        }
    }

    let t = 1.0
        - 0.17 * ((h_bar_prime - 30.0) * DEG_TO_RAD).cos()
        + 0.24 * (2.0 * h_bar_prime * DEG_TO_RAD).cos()
        + 0.32 * ((3.0 * h_bar_prime + 6.0) * DEG_TO_RAD).cos()
        - 0.20 * ((4.0 * h_bar_prime - 63.0) * DEG_TO_RAD).cos();

    let theta_scaled = (h_bar_prime - 275.0) / 25.0;
    let delta_theta = 30.0 * (-(theta_scaled * theta_scaled)).exp();
    let c_bar_prime_7 = pow7(c_bar_prime);
    let r_c = 2.0 * (c_bar_prime_7 / (c_bar_prime_7 + TWENTY_FIVE_POW_7)).sqrt();

    let l_bar_offset = l_bar_prime - 50.0;
    let l_bar_offset_sq = l_bar_offset * l_bar_offset;
    let s_l = 1.0 + (0.015 * l_bar_offset_sq) / (20.0 + l_bar_offset_sq).sqrt();
    let s_c = 1.0 + 0.045 * c_bar_prime;
    let s_h = 1.0 + 0.015 * c_bar_prime * t;
    let r_t = -(2.0 * delta_theta * DEG_TO_RAD).sin() * r_c;

    let term_l = delta_l_prime / s_l;
    let term_c = delta_c_prime / s_c;
    let term_h = delta_h_prime / s_h;

    Ok((term_l * term_l + term_c * term_c + term_h * term_h + r_t * term_c * term_h).sqrt())
}
