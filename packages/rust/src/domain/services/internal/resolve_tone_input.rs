use crate::domain::models::{ColorToneInput, OkyctError};
use super::super::tone_y::y_to_tone;
use super::srgb_lut::{parse_hex_to_rgb24, srgb_byte_to_linear};

pub fn resolve_tone_input(input: ColorToneInput<'_>) -> Result<f64, OkyctError> {
    let tone = match input {
        ColorToneInput::Tone(t) => t,
        ColorToneInput::Hex(hex) => {
            let rgb24 = parse_hex_to_rgb24(hex)?;
            let r8 = ((rgb24 >> 16) & 255) as u8;
            let g8 = ((rgb24 >> 8) & 255) as u8;
            let b8 = (rgb24 & 255) as u8;
            let rl = srgb_byte_to_linear(r8);
            let y = if r8 == g8 && g8 == b8 {
                rl
            } else {
                0.2126729 * rl
                    + 0.7151522 * srgb_byte_to_linear(g8)
                    + 0.0721750 * srgb_byte_to_linear(b8)
            };
            y_to_tone(y)?
        }
        ColorToneInput::Okyct(okyct) => okyct.t,
    };

    if !tone.is_finite() || !(0.0..=100.0).contains(&tone) {
        return Err(OkyctError::new(format!(
            "Invalid tone value: {tone}. Expected a finite number in [0, 100]."
        )));
    }

    Ok(tone)
}
