use crate::domain::models::{ColorToneInput, CvdType, OkyctError};
use crate::domain::services::{
    get_apca_contrast, get_contrast_ratio, get_delta_e_oklab, hex_to_okyct, simulate_cvd,
};
use crate::ports::inbound::{
    AuditSchemeCvdOptions, ContrastAuditItem, CvdSeparabilityAuditItem, DynamicSchemeColors,
    SystemColorToken,
};

const CONTRAST_AUDIT_PAIRS: [(SystemColorToken, SystemColorToken, f64, f64); 23] = [
    (SystemColorToken::OnPrimary, SystemColorToken::Primary, 4.5, 60.0),
    (SystemColorToken::OnPrimaryContainer, SystemColorToken::PrimaryContainer, 4.5, 60.0),
    (SystemColorToken::OnPrimaryFixed, SystemColorToken::PrimaryFixed, 4.5, 60.0),
    (SystemColorToken::OnPrimaryFixedVariant, SystemColorToken::PrimaryFixedDim, 4.5, 60.0),
    (SystemColorToken::OnSecondary, SystemColorToken::Secondary, 4.5, 60.0),
    (SystemColorToken::OnSecondaryContainer, SystemColorToken::SecondaryContainer, 4.5, 60.0),
    (SystemColorToken::OnTertiary, SystemColorToken::Tertiary, 4.5, 60.0),
    (SystemColorToken::OnTertiaryContainer, SystemColorToken::TertiaryContainer, 4.5, 60.0),
    (SystemColorToken::OnSurface, SystemColorToken::Surface, 4.5, 60.0),
    (SystemColorToken::OnSurfaceVariant, SystemColorToken::SurfaceVariant, 4.5, 60.0),
    (SystemColorToken::OnSurface, SystemColorToken::SurfaceContainer, 4.5, 60.0),
    (SystemColorToken::OnError, SystemColorToken::Error, 4.5, 60.0),
    (SystemColorToken::OnErrorContainer, SystemColorToken::ErrorContainer, 4.5, 60.0),
    (SystemColorToken::OnWarning, SystemColorToken::Warning, 4.5, 60.0),
    (SystemColorToken::OnWarningContainer, SystemColorToken::WarningContainer, 4.5, 60.0),
    (SystemColorToken::OnSuccess, SystemColorToken::Success, 4.5, 60.0),
    (SystemColorToken::OnSuccessContainer, SystemColorToken::SuccessContainer, 4.5, 60.0),
    (SystemColorToken::OnInfo, SystemColorToken::Info, 4.5, 60.0),
    (SystemColorToken::OnInfoContainer, SystemColorToken::InfoContainer, 4.5, 60.0),
    (SystemColorToken::InverseOnSurface, SystemColorToken::InverseSurface, 4.5, 60.0),
    (SystemColorToken::InverseOnPrimary, SystemColorToken::InversePrimary, 4.5, 60.0),
    (SystemColorToken::InverseOnPrimaryContainer, SystemColorToken::InversePrimaryContainer, 4.5, 60.0),
    (SystemColorToken::Outline, SystemColorToken::Surface, 3.0, 45.0),
];

#[inline]
fn round_to_decimals(value: f64, decimals: i32) -> f64 {
    let factor = 10_f64.powi(decimals);
    ((value * factor) + 0.5).floor() / factor
}

pub fn audit_scheme_contrast(scheme: &DynamicSchemeColors) -> Result<Vec<ContrastAuditItem>, OkyctError> {
    let mut items = Vec::with_capacity(CONTRAST_AUDIT_PAIRS.len());
    for (fg, bg, min_ratio, min_apca) in CONTRAST_AUDIT_PAIRS {
        let fg_hex = scheme.get(fg);
        let bg_hex = scheme.get(bg);
        let fg_tone = hex_to_okyct(fg_hex)?.t;
        let bg_tone = hex_to_okyct(bg_hex)?.t;
        let wcag = get_contrast_ratio(ColorToneInput::Tone(fg_tone), ColorToneInput::Tone(bg_tone))?;
        let apca = get_apca_contrast(ColorToneInput::Tone(fg_tone), ColorToneInput::Tone(bg_tone))?.abs();

        items.push(ContrastAuditItem {
            fg_role: fg,
            bg_role: bg,
            fg_tone: round_to_decimals(fg_tone, 2),
            bg_tone: round_to_decimals(bg_tone, 2),
            wcag_ratio: round_to_decimals(wcag, 2),
            wcag_pass_aa: wcag >= min_ratio,
            wcag_pass_aaa: wcag >= 7.0,
            apca_lc: apca,
            apca_pass: apca >= min_apca,
        });
    }
    Ok(items)
}

const SEMANTIC_AUDIT_PAIRS: [(SystemColorToken, SystemColorToken); 6] = [
    (SystemColorToken::Error, SystemColorToken::Success),
    (SystemColorToken::Error, SystemColorToken::Warning),
    (SystemColorToken::Warning, SystemColorToken::Success),
    (SystemColorToken::Primary, SystemColorToken::Error),
    (SystemColorToken::Primary, SystemColorToken::Tertiary),
    (SystemColorToken::ErrorContainer, SystemColorToken::SuccessContainer),
];

pub fn audit_scheme_cvd(
    scheme: &DynamicSchemeColors,
    options: &AuditSchemeCvdOptions,
) -> Result<Vec<CvdSeparabilityAuditItem>, OkyctError> {
    for &cvd_type in &options.cvd_types {
        if cvd_type == CvdType::None {
            return Err(OkyctError::new(
                "Invalid cvdType in auditSchemeCvd: \"none\". Expected protanopia, deuteranopia, tritanopia, or achromatopsia.",
            ));
        }
    }
    if !options.min_delta_e.is_finite() || options.min_delta_e < 0.0 {
        return Err(OkyctError::new(format!(
            "Invalid minDeltaE: {}. Expected a finite number >= 0.",
            options.min_delta_e
        )));
    }
    if !options.min_delta_tone.is_finite() || options.min_delta_tone < 0.0 {
        return Err(OkyctError::new(format!(
            "Invalid minDeltaTone: {}. Expected a finite number >= 0.",
            options.min_delta_tone
        )));
    }

    let mut items = Vec::with_capacity(options.cvd_types.len() * SEMANTIC_AUDIT_PAIRS.len());
    for &cvd_type in &options.cvd_types {
        for (role_a, role_b) in SEMANTIC_AUDIT_PAIRS {
            let proj_a = simulate_cvd(scheme.get(role_a), cvd_type, options.severity)?;
            let proj_b = simulate_cvd(scheme.get(role_b), cvd_type, options.severity)?;
            let delta_e_oklab = round_to_decimals(get_delta_e_oklab(&proj_a, &proj_b)?, 4);
            let delta_tone = round_to_decimals((hex_to_okyct(&proj_a)?.t - hex_to_okyct(&proj_b)?.t).abs(), 2);

            let separable = delta_e_oklab >= options.min_delta_e || delta_tone >= options.min_delta_tone;
            let recommendation = if separable {
                "OK".to_string()
            } else {
                format!(
                    "Low {} separability (ΔE={delta_e_oklab}, ΔT={delta_tone}): separate Tone by >={} or shift hue/iconography.",
                    cvd_type.as_str(),
                    options.min_delta_tone
                )
            };

            items.push(CvdSeparabilityAuditItem {
                role_a,
                role_b,
                cvd_type,
                delta_e_oklab,
                delta_tone,
                separable,
                recommendation,
            });
        }
    }
    Ok(items)
}
