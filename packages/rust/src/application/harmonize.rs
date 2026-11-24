use crate::domain::models::{ColorConversionOptions, Okyct, OkyctError};
use crate::domain::services::{find_max_chroma_for_tone, hex_to_okyct, okyct_to_hex};

#[inline]
fn smoothstep(edge0: f64, edge1: f64, x: f64) -> f64 {
    let t = ((x - edge0) / (edge1 - edge0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

pub fn harmonize_hex(
    design_hex: &str,
    source_hex: &str,
    max_shift_angle: f64,
) -> Result<String, OkyctError> {
    if !max_shift_angle.is_finite() || max_shift_angle < 0.0 {
        return Err(OkyctError::new(format!(
            "Invalid maxShiftAngle: {max_shift_angle}. Expected a non-negative finite number."
        )));
    }
    let design = hex_to_okyct(design_hex)?;
    let source = hex_to_okyct(source_hex)?;

    let source_chroma_weight = smoothstep(0.005, 0.035, source.c);
    if source_chroma_weight <= 0.0 {
        return Ok(design_hex.to_string());
    }

    let mut diff = (source.h - design.h + 180.0).rem_euclid(360.0) - 180.0;
    if diff < -180.0 {
        diff += 360.0;
    }

    if diff.abs() < 120.0 {
        let sign = if diff > 0.0 {
            1.0
        } else if diff < 0.0 {
            -1.0
        } else {
            0.0
        };
        let shift = sign * (diff.abs() * 0.45).min(max_shift_angle) * source_chroma_weight;
        let new_hue = (design.h + shift).rem_euclid(360.0);

        let max_old = find_max_chroma_for_tone(design.h, design.t, Default::default())?;
        let max_new = find_max_chroma_for_tone(new_hue, design.t, Default::default())?;
        let scaled_chroma = if max_old > 1e-4 {
            design.c.min(design.c * (max_new / max_old))
        } else {
            design.c
        };

        return okyct_to_hex(
            Okyct::new(new_hue, scaled_chroma, design.t),
            ColorConversionOptions::default(),
        );
    }

    Ok(design_hex.to_string())
}

pub fn is_warm_hue(hue: f64) -> Result<bool, OkyctError> {
    if !hue.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid hue value: {hue}. Expected a finite number."
        )));
    }
    let normalized = hue.rem_euclid(360.0);
    Ok((20.0..=110.0).contains(&normalized) || normalized >= 340.0)
}
