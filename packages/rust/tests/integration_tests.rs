use okyct::{
    ColorConversionOptions, CreateThemeOptions, CssColorFormat, GamutMappingMode, GamutTarget,
    TonalPalette, TonalPaletteOptions, create_theme, hex_to_okyct, okyct_to_hex,
    run_colorimetric_invariant_suite,
};

#[test]
fn colorimetric_invariant_suite_passes_all_five_checks() {
    let results = run_colorimetric_invariant_suite();
    assert_eq!(results.len(), 5);
    for item in &results {
        assert!(
            item.passed,
            "Invariant {} failed: {} (measured: {}, threshold: {})",
            item.id, item.name, item.measured_value, item.threshold
        );
    }
}

#[test]
fn tonal_palette_lru_cache_and_bounds_work() {
    let palette = TonalPalette::from_hex(
        "#2563eb",
        TonalPaletteOptions {
            max_cache_size: 4,
            ..Default::default()
        },
    )
    .unwrap();
    let t40 = palette.tone(40.0).unwrap();
    let t40_again = palette.tone(40.0).unwrap();
    assert_eq!(t40, t40_again);
    assert!(palette.cache_size() <= 8);

    let p3_css = palette.tone_css(50.0, CssColorFormat::DisplayP3).unwrap();
    assert!(p3_css.starts_with("color(display-p3 "));

    let oklch_css = palette.tone_css(50.0, CssColorFormat::Oklch).unwrap();
    assert!(oklch_css.starts_with("oklch("));
}

#[test]
fn display_p3_rejects_okyct_to_hex() {
    let err = okyct_to_hex(
        hex_to_okyct("#2563eb").unwrap(),
        ColorConversionOptions::new(GamutTarget::DisplayP3, GamutMappingMode::PreserveTone),
    )
    .unwrap_err();
    assert!(err.message().contains("okyctToHex"));
}

#[test]
fn create_theme_supports_simple_seed_and_audits() {
    let theme = create_theme(&CreateThemeOptions::new("#2563eb")).unwrap();
    for item in theme.audit_contrast(okyct::ThemeMode::Dark).unwrap() {
        assert!(item.wcag_pass_aa, "Dark contrast failed for {:?}", item.fg_role);
        assert!(item.apca_pass, "Dark APCA failed for {:?}", item.fg_role);
    }
    for item in theme.audit_contrast(okyct::ThemeMode::Light).unwrap() {
        assert!(item.wcag_pass_aa, "Light contrast failed for {:?}", item.fg_role);
        assert!(item.apca_pass, "Light APCA failed for {:?}", item.fg_role);
    }
}
