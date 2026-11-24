use crate::domain::models::OkyctError;
use super::super::trim_ascii_whitespace::trim_ascii_whitespace;

pub const fn build_srgb_byte_to_unit_lut() -> [f64; 256] {
    let mut lut = [0.0; 256];
    let mut i = 0;
    while i < 256 {
        lut[i] = (i as f64) / 255.0;
        i += 1;
    }
    lut
}

pub static SRGB_BYTE_TO_UNIT_LUT: [f64; 256] = build_srgb_byte_to_unit_lut();

pub fn srgb_byte_to_linear(byte: u8) -> f64 {
    let c = (byte as f64) / 255.0;
    if c <= 0.04045 {
        c / 12.92
    } else {
        ((c + 0.055) / 1.055).powf(2.4)
    }
}

#[inline]
fn hex_nibble(b: u8) -> Option<u32> {
    match b {
        b'0'..=b'9' => Some((b - b'0') as u32),
        b'A'..=b'F' => Some((b - b'A' + 10) as u32),
        b'a'..=b'f' => Some((b - b'a' + 10) as u32),
        _ => None,
    }
}

pub fn parse_hex_to_rgb24(hex: &str) -> Result<u32, OkyctError> {
    let trimmed = trim_ascii_whitespace(hex);
    let bytes = trimmed.as_bytes();
    let start = usize::from(bytes.first() == Some(&b'#'));
    let slice = &bytes[start..];

    if slice.len() == 6 {
        if let (Some(n0), Some(n1), Some(n2), Some(n3), Some(n4), Some(n5)) = (
            hex_nibble(slice[0]),
            hex_nibble(slice[1]),
            hex_nibble(slice[2]),
            hex_nibble(slice[3]),
            hex_nibble(slice[4]),
            hex_nibble(slice[5]),
        ) {
            return Ok((n0 << 20) | (n1 << 16) | (n2 << 12) | (n3 << 8) | (n4 << 4) | n5);
        }
    } else if slice.len() == 3
        && let (Some(n0), Some(n1), Some(n2)) = (
            hex_nibble(slice[0]),
            hex_nibble(slice[1]),
            hex_nibble(slice[2]),
        )
    {
        let r8 = (n0 << 4) | n0;
        let g8 = (n1 << 4) | n1;
        let b8 = (n2 << 4) | n2;
        return Ok((r8 << 16) | (g8 << 8) | b8);
    }

    Err(OkyctError::new(format!(
        "Invalid hex color format: \"{hex}\". Expected #RGB or #RRGGBB hexadecimal string."
    )))
}
