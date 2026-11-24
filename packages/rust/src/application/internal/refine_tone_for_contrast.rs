use crate::domain::models::OkyctError;

pub struct RefineToneForContrastResult {
    pub tone: f64,
    pub hex: String,
    pub passed: bool,
}

pub fn refine_tone_for_contrast<FResolve, FPasses>(
    start_tone: f64,
    limit_tone: f64,
    mut resolve_hex: FResolve,
    mut passes: FPasses,
    tolerance: f64,
    max_iterations: usize,
) -> Result<RefineToneForContrastResult, OkyctError>
where
    FResolve: FnMut(f64) -> Result<String, OkyctError>,
    FPasses: FnMut(&str) -> Result<bool, OkyctError>,
{
    let start_hex = resolve_hex(start_tone)?;
    if passes(&start_hex)? {
        return Ok(RefineToneForContrastResult {
            tone: start_tone,
            hex: start_hex,
            passed: true,
        });
    }

    if start_tone == limit_tone {
        return Ok(RefineToneForContrastResult {
            tone: start_tone,
            hex: start_hex,
            passed: false,
        });
    }

    let limit_hex = resolve_hex(limit_tone)?;
    if !passes(&limit_hex)? {
        return Ok(RefineToneForContrastResult {
            tone: limit_tone,
            hex: limit_hex,
            passed: false,
        });
    }

    let mut fail_tone = start_tone;
    let mut pass_tone = limit_tone;
    let mut best_hex = limit_hex;

    for _ in 0..max_iterations {
        if (pass_tone - fail_tone).abs() <= tolerance {
            break;
        }
        let mid = (fail_tone + pass_tone) * 0.5;
        let mid_hex = resolve_hex(mid)?;
        if passes(&mid_hex)? {
            pass_tone = mid;
            best_hex = mid_hex;
        } else {
            fail_tone = mid;
        }
    }

    Ok(RefineToneForContrastResult {
        tone: pass_tone,
        hex: best_hex,
        passed: true,
    })
}
