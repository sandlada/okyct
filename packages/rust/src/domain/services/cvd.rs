use crate::domain::models::{CvdType, OkyctError, Rgb};
use super::hex_rgb::rgb_to_hex;
use super::internal::srgb_lut::{parse_hex_to_rgb24, srgb_byte_to_linear};
use super::srgb_to_linear::linear_to_srgb;

const PROTAN_MATRIX: [[f64; 3]; 3] = [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
];

const DEUTAN_MATRIX: [[f64; 3]; 3] = [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
];

const TRITAN_MATRIX: [[f64; 3]; 3] = [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
];

const ACHROM_MATRIX: [[f64; 3]; 3] = [
    [0.2126729, 0.7151522, 0.072175],
    [0.2126729, 0.7151522, 0.072175],
    [0.2126729, 0.7151522, 0.072175],
];

pub fn simulate_cvd(hex: &str, cvd_type: CvdType, severity: f64) -> Result<String, OkyctError> {
    if !severity.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid CVD severity: {severity}. Expected a finite number in [0, 1]."
        )));
    }

    let rgb24 = parse_hex_to_rgb24(hex)?;
    let s = severity.clamp(0.0, 1.0);
    if cvd_type == CvdType::None || s == 0.0 {
        return Ok(hex.to_string());
    }

    let rl = srgb_byte_to_linear(((rgb24 >> 16) & 255) as u8);
    let gl = srgb_byte_to_linear(((rgb24 >> 8) & 255) as u8);
    let bl = srgb_byte_to_linear((rgb24 & 255) as u8);

    let m = match cvd_type {
        CvdType::Protanopia => &PROTAN_MATRIX,
        CvdType::Deuteranopia => &DEUTAN_MATRIX,
        CvdType::Tritanopia => &TRITAN_MATRIX,
        CvdType::Achromatopsia => &ACHROM_MATRIX,
        CvdType::None => unreachable!(),
    };

    let r_proj = m[0][0] * rl + m[0][1] * gl + m[0][2] * bl;
    let g_proj = m[1][0] * rl + m[1][1] * gl + m[1][2] * bl;
    let b_proj = m[2][0] * rl + m[2][1] * gl + m[2][2] * bl;

    let r_out = ((1.0 - s) * rl + s * r_proj).clamp(0.0, 1.0);
    let g_out = ((1.0 - s) * gl + s * g_proj).clamp(0.0, 1.0);
    let b_out = ((1.0 - s) * bl + s * b_proj).clamp(0.0, 1.0);

    rgb_to_hex(Rgb::new(
        linear_to_srgb(r_out)?,
        linear_to_srgb(g_out)?,
        linear_to_srgb(b_out)?,
    ))
}
