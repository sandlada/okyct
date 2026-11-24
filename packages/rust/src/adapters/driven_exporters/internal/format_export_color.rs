use crate::domain::models::{CssColorFormat, GamutMappingMode, Okyct, OkyctError};
use crate::domain::services::{hex_to_okyct, okyct_to_display_p3_css, okyct_to_oklch_css};
use crate::ports::inbound::{DynamicSchemeColors, SystemColorToken};

pub fn format_color_value(
    hex: &str,
    format: CssColorFormat,
    okyct: Option<Okyct>,
) -> Result<String, OkyctError> {
    if format == CssColorFormat::Hex {
        return Ok(hex.to_string());
    }
    let coord = match okyct {
        Some(c) => c,
        None => hex_to_okyct(hex)?,
    };
    match format {
        CssColorFormat::Hex => unreachable!(),
        CssColorFormat::Oklch => okyct_to_oklch_css(coord),
        CssColorFormat::DisplayP3 => okyct_to_display_p3_css(coord, GamutMappingMode::PreserveTone),
    }
}

pub fn format_scheme_token(
    scheme: &DynamicSchemeColors,
    token: SystemColorToken,
    format: CssColorFormat,
) -> Result<String, OkyctError> {
    format_color_value(scheme.get(token), format, scheme.okyct.get(&token).copied())
}
