use crate::domain::models::{OkyctError, Rgb};
use super::internal::srgb_lut::{SRGB_BYTE_TO_UNIT_LUT, parse_hex_to_rgb24};

pub fn hex_to_rgb(hex: &str) -> Result<Rgb, OkyctError> {
    let rgb24 = parse_hex_to_rgb24(hex)?;
    Ok(Rgb::new(
        SRGB_BYTE_TO_UNIT_LUT[((rgb24 >> 16) & 255) as usize],
        SRGB_BYTE_TO_UNIT_LUT[((rgb24 >> 8) & 255) as usize],
        SRGB_BYTE_TO_UNIT_LUT[(rgb24 & 255) as usize],
    ))
}

#[inline]
fn channel_to_byte(c: f64) -> u8 {
    if c <= 0.0 {
        0
    } else if c >= 1.0 {
        255
    } else {
        (c * 255.0 + 0.5).floor() as u8
    }
}

pub fn rgb_to_hex(rgb: Rgb) -> Result<String, OkyctError> {
    if !rgb.r.is_finite() || !rgb.g.is_finite() || !rgb.b.is_finite() {
        return Err(OkyctError::new(
            "Invalid RGB input: expected finite numeric r, g, and b fields.",
        ));
    }
    let r = channel_to_byte(rgb.r);
    let g = channel_to_byte(rgb.g);
    let b = channel_to_byte(rgb.b);
    Ok(format!("#{r:02x}{g:02x}{b:02x}"))
}

pub fn shortest_hue_delta(h1: f64, h2: f64) -> Result<f64, OkyctError> {
    if !h1.is_finite() || !h2.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid hue values: h1={h1}, h2={h2}. Expected finite numbers."
        )));
    }
    let diff = (h1 - h2).abs() % 360.0;
    Ok(if diff > 180.0 { 360.0 - diff } else { diff })
}
