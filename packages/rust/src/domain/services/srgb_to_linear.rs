use crate::domain::models::OkyctError;

pub fn srgb_to_linear(c: f64) -> Result<f64, OkyctError> {
    if !c.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid sRGB channel value: {c}. Expected a finite number."
        )));
    }
    if c == 1.0 {
        return Ok(1.0);
    }
    Ok(if c <= 0.04045 {
        c / 12.92
    } else {
        ((c + 0.055) / 1.055).powf(2.4)
    })
}

pub fn linear_to_srgb(c: f64) -> Result<f64, OkyctError> {
    if !c.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid linear RGB channel value: {c}. Expected a finite number."
        )));
    }
    if c == 1.0 {
        return Ok(1.0);
    }
    Ok(if c <= 0.0031308 {
        12.92 * c
    } else {
        1.055 * (c.max(0.0).powf(1.0 / 2.4) - 1.0) + 1.0
    })
}
