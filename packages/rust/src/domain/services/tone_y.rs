use crate::domain::models::OkyctError;

const CIE_EPSILON: f64 = 216.0 / 24389.0;
const CIE_KAPPA: f64 = 24389.0 / 27.0;

#[inline]
pub(crate) fn tone_to_y_unchecked(tone: f64) -> f64 {
    if tone <= 0.0 {
        return 0.0;
    }
    if tone >= 100.0 {
        return 1.0;
    }
    if tone <= 8.0 {
        return tone / CIE_KAPPA;
    }
    let y_root = (tone + 16.0) / 116.0;
    y_root * y_root * y_root
}

pub fn tone_to_y(tone: f64) -> Result<f64, OkyctError> {
    if !tone.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid tone value: {tone}. Expected a finite number in [0, 100]."
        )));
    }
    Ok(tone_to_y_unchecked(tone))
}

#[inline]
pub(crate) fn y_to_tone_unchecked(y: f64) -> f64 {
    if y <= 0.0 {
        return 0.0;
    }
    if y >= 1.0 {
        return 100.0;
    }
    if y <= CIE_EPSILON {
        return y * CIE_KAPPA;
    }
    (116.0 * y.cbrt() - 16.0).min(100.0)
}

pub fn y_to_tone(y: f64) -> Result<f64, OkyctError> {
    if !y.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid relative luminance Y: {y}. Expected a finite number."
        )));
    }
    Ok(y_to_tone_unchecked(y))
}
