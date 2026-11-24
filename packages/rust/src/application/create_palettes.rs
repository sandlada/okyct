use crate::domain::models::OkyctError;
use crate::domain::services::hex_to_okyct;
use crate::ports::inbound::{
    CreatePalettesOptions, PaletteSet, PaletteVariant, TonalPaletteOptions,
};
use super::harmonize::{harmonize_hex, is_warm_hue};
use super::tonal_palette::TonalPalette;

pub fn create_palettes_from_source(
    source_hex: &str,
    options: CreatePalettesOptions,
) -> Result<PaletteSet<TonalPalette>, OkyctError> {
    let palette_opts = TonalPaletteOptions {
        gamut: options.gamut,
        hk_compensation: options.hk_compensation,
        soft_knee: options.soft_knee,
        max_cache_size: options.max_cache_size,
    };

    let source = hex_to_okyct(source_hex)?;
    let h = source.h;
    let c = source.c.max(0.04);

    let mut error_hex = "#BA1A1A".to_string();
    let mut warning_hex = "#E69900".to_string();
    let mut success_hex = "#1E8E3E".to_string();
    let mut info_hex = "#0288D1".to_string();

    if options.harmonize_semantics {
        error_hex = harmonize_hex(&error_hex, source_hex, 15.0)?;
        warning_hex = harmonize_hex(&warning_hex, source_hex, 18.0)?;
        success_hex = harmonize_hex(&success_hex, source_hex, 18.0)?;
        info_hex = harmonize_hex(&info_hex, source_hex, 18.0)?;
    }

    let neutral_chroma = if is_warm_hue(h)? { 0.012 } else { 0.014 };
    let neutral_variant_chroma = neutral_chroma * 2.2;

    let error = TonalPalette::from_hex(&error_hex, palette_opts)?;
    let warning = TonalPalette::from_hex(&warning_hex, palette_opts)?;
    let success = TonalPalette::from_hex(&success_hex, palette_opts)?;
    let info = TonalPalette::from_hex(&info_hex, palette_opts)?;

    match options.variant {
        PaletteVariant::Vibrant => Ok(PaletteSet {
            primary: TonalPalette::new(h, c.max(0.12), palette_opts)?,
            secondary: TonalPalette::new((h + 25.0) % 360.0, (c * 0.7).max(0.08), palette_opts)?,
            tertiary: TonalPalette::new((h + 60.0) % 360.0, (c * 0.85).max(0.1), palette_opts)?,
            neutral: TonalPalette::new(h, neutral_chroma * 1.5, palette_opts)?,
            neutral_variant: TonalPalette::new(h, neutral_variant_chroma * 1.3, palette_opts)?,
            error,
            warning,
            success,
            info,
        }),
        PaletteVariant::Expressive => Ok(PaletteSet {
            primary: TonalPalette::new(h, c.max(0.1), palette_opts)?,
            secondary: TonalPalette::new((h + 90.0) % 360.0, (c * 0.65).max(0.07), palette_opts)?,
            tertiary: TonalPalette::new((h + 180.0) % 360.0, (c * 0.8).max(0.09), palette_opts)?,
            neutral: TonalPalette::new((h + 15.0) % 360.0, neutral_chroma * 1.4, palette_opts)?,
            neutral_variant: TonalPalette::new(
                (h + 15.0) % 360.0,
                neutral_variant_chroma * 1.3,
                palette_opts,
            )?,
            error,
            warning,
            success,
            info,
        }),
        PaletteVariant::Neutral => Ok(PaletteSet {
            primary: TonalPalette::new(h, (c * 0.6).min(0.08), palette_opts)?,
            secondary: TonalPalette::new(h, (c * 0.35).min(0.04), palette_opts)?,
            tertiary: TonalPalette::new((h + 40.0) % 360.0, (c * 0.45).min(0.05), palette_opts)?,
            neutral: TonalPalette::new(h, neutral_chroma * 0.8, palette_opts)?,
            neutral_variant: TonalPalette::new(h, neutral_variant_chroma * 0.8, palette_opts)?,
            error,
            warning,
            success,
            info,
        }),
        PaletteVariant::Monochrome => Ok(PaletteSet {
            primary: TonalPalette::new(h, 0.0, palette_opts)?,
            secondary: TonalPalette::new(h, 0.0, palette_opts)?,
            tertiary: TonalPalette::new(h, 0.0, palette_opts)?,
            neutral: TonalPalette::new(h, 0.0, palette_opts)?,
            neutral_variant: TonalPalette::new(h, 0.0, palette_opts)?,
            error,
            warning,
            success,
            info,
        }),
        PaletteVariant::Fidelity => Ok(PaletteSet {
            primary: TonalPalette::new(h, c, palette_opts)?,
            secondary: TonalPalette::new((h + 15.0) % 360.0, c * 0.5, palette_opts)?,
            tertiary: TonalPalette::new((h + 30.0) % 360.0, c * 0.7, palette_opts)?,
            neutral: TonalPalette::new(h, neutral_chroma, palette_opts)?,
            neutral_variant: TonalPalette::new(h, neutral_variant_chroma, palette_opts)?,
            error,
            warning,
            success,
            info,
        }),
        PaletteVariant::TonalSpot => Ok(PaletteSet {
            primary: TonalPalette::new(h, c.clamp(0.09, 0.18), palette_opts)?,
            secondary: TonalPalette::new((h + 15.0) % 360.0, (c * 0.45).max(0.04), palette_opts)?,
            tertiary: TonalPalette::new((h + 60.0) % 360.0, (c * 0.65).max(0.06), palette_opts)?,
            neutral: TonalPalette::new(h, neutral_chroma, palette_opts)?,
            neutral_variant: TonalPalette::new(h, neutral_variant_chroma, palette_opts)?,
            error,
            warning,
            success,
            info,
        }),
    }
}
