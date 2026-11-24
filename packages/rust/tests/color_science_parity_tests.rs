mod common;

use std::fs;
use std::path::Path;

use common::{Json, parse_json, sha256_hex};
use okyct::{
    AuditSchemeCvdOptions, BlendSpace, BuildSchemeOptions, ColorConversionOptions, ColorLayer,
    ColorToneInput, ContrastMetric, ContrastSolveOptions, CreatePalettesOptions, CreateThemeOptions,
    CssColorFormat, CssColorMixSpace, CssSchemeMode, CustomColorInput, CvdType, EmissivePanelType,
    EmissiveSchemeOptions, ExportThemeOptions, ExtractSeedsOptions, GamutMappingMode, GamutTarget,
    ImagePixelBuffer, ImageQuantizerMode, NamingCase, Okyct, OkyctTheme,
    PaletteVariant, Rgb, StackOptions, StackStateInput, StandardPaletteKey, StateLayerState,
    StateLayersOption, SystemColorToken, ThemeMode, TokenExportFormat, audit_oled_power,
    audit_scheme_cvd, audit_stacked_contrast, build_dynamic_scheme_from_palettes,
    compute_color_emissive_telemetry, create_palettes_from_source, create_theme, diff_theme_parity,
    extract_seeds_from_image_data, filter_tokens, find_gamut_cusp, find_max_chroma_for_tone,
    flatten_tokens, get_apca_contrast, get_contrast_ratio, get_delta_e_2000, get_delta_e_oklab,
    hex_to_okyct, hex_to_rgb, is_in_gamut, is_in_srgb_gamut, limit_blue_emission, linear_to_srgb,
    map_tokens, nest_tokens, okyct_to_display_p3_css, okyct_to_hex, okyct_to_oklch_css,
    okyct_to_rgb, omit_tokens, optimize_for_oled, pick_tokens, rename_case, rgb_to_hex,
    rgb_to_okyct, run_colorimetric_invariant_suite, shortest_hue_delta, simulate_cvd,
    solve_tones_for_apca, solve_tones_for_contrast, srgb_to_linear, stack_layers,
    stack_state_layers, stack_to_css_color_mix, to_css_rule_block, to_css_var_ref, tone_to_y,
    validate_contract, with_alpha, with_prefix, y_to_tone,
};

fn assert_near(actual: f64, expected: f64, eps: f64, ctx: &str) {
    assert!(
        (actual - expected).abs() <= eps,
        "{ctx}: expected {expected}, got {actual} (diff={})",
        (actual - expected).abs()
    );
}

fn parse_okyct_json(j: &Json) -> Okyct {
    Okyct::new(
        j.get("h").unwrap().as_f64().unwrap(),
        j.get("c").unwrap().as_f64().unwrap(),
        j.get("t").unwrap().as_f64().unwrap(),
    )
}

fn parse_rgb_json(j: &Json) -> Rgb {
    Rgb::new(
        j.get("r").unwrap().as_f64().unwrap(),
        j.get("g").unwrap().as_f64().unwrap(),
        j.get("b").unwrap().as_f64().unwrap(),
    )
}

fn parse_tone_input(j: &Json) -> ColorToneInput<'_> {
    match j {
        Json::Number(n) => ColorToneInput::Tone(*n),
        Json::String(s) => ColorToneInput::Hex(s.as_str()),
        Json::Object(_) => ColorToneInput::Okyct(parse_okyct_json(j)),
        _ => panic!("Unexpected tone input: {j:?}"),
    }
}

fn build_fixture_theme() -> OkyctTheme {
    let mut opts = CreateThemeOptions::new("#2563eb");
    opts.custom_colors = vec![
        CustomColorInput {
            id: None,
            name: "brandAccent😀".to_string(),
            label: Some("品牌輔色😀".to_string()),
            source_hex: "#e93".to_string(),
            harmonize: None,
        },
        CustomColorInput {
            id: None,
            name: "ext𠮷Glyph".to_string(),
            label: Some("擴充𠮷 \"literal \\uD83D\\uDE00\"".to_string()),
            source_hex: "#39e".to_string(),
            harmonize: None,
        },
    ];
    opts.emissive = EmissiveSchemeOptions {
        profile: EmissivePanelType::WoledDesktop,
        burn_in_guard: true,
        anti_fringing: false,
        abl_guard: false,
    };
    opts.state_layers =
        StateLayersOption::Selected(vec![StateLayerState::Dragged, StateLayerState::Hovered]);
    opts.gamut = GamutTarget::DisplayP3;
    create_theme(&opts).unwrap()
}

fn assert_json_equal_with_eps(actual: &Json, expected: &Json, path: &str) {
    match (actual, expected) {
        (Json::Null, Json::Null) => {}
        (Json::Bool(a), Json::Bool(b)) => assert_eq!(a, b, "at {path}"),
        (Json::String(a), Json::String(b)) => assert_eq!(a, b, "at {path}"),
        (Json::Number(a), Json::Number(b)) => assert_near(*a, *b, 1e-9, path),
        (Json::Array(a), Json::Array(b)) => {
            assert_eq!(a.len(), b.len(), "array len at {path}");
            for (i, (ai, bi)) in a.iter().zip(b.iter()).enumerate() {
                assert_json_equal_with_eps(ai, bi, &format!("{path}[{i}]"));
            }
        }
        (Json::Object(a), Json::Object(b)) => {
            assert_eq!(a.len(), b.len(), "object len at {path}");
            for (k, bv) in b {
                let av = a
                    .iter()
                    .find(|(ak, _)| ak == k)
                    .map(|(_, v)| v)
                    .unwrap_or_else(|| panic!("missing key {k} at {path}"));
                assert_json_equal_with_eps(av, bv, &format!("{path}.{k}"));
            }
        }
        _ => panic!("type mismatch at {path}: actual={actual:?}, expected={expected:?}"),
    }
}

#[test]
fn all_typescript_color_science_fixtures_pass() {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let fixture_path = manifest_dir.join("../csharp/Sandlada.Okyct.Tests/color-science.json");
    let raw = fs::read_to_string(&fixture_path)
        .unwrap_or_else(|e| panic!("Failed to read {}: {e}", fixture_path.display()));
    let root = parse_json(&raw).expect("valid fixture json");
    let fixtures = root.as_array().expect("root array");

    let theme = build_fixture_theme();

    for (idx, item) in fixtures.iter().enumerate() {
        let api = item.get("api").unwrap().as_str().unwrap();
        let args = item.get("args").unwrap().as_array().unwrap();
        let throws = item.get("throws").and_then(|v| v.as_bool()).unwrap_or(false);
        let expected = item.get("expected");
        let ctx = format!("fixture[{idx}] {api}");

        match api {
            "hexToRgb" => {
                let res = hex_to_rgb(args[0].as_str().unwrap());
                if throws {
                    assert!(res.is_err(), "{ctx} expected error");
                } else {
                    let r = res.unwrap();
                    let exp = parse_rgb_json(expected.unwrap());
                    assert_near(r.r, exp.r, 1e-12, &ctx);
                    assert_near(r.g, exp.g, 1e-12, &ctx);
                    assert_near(r.b, exp.b, 1e-12, &ctx);
                }
            }
            "hexToOkyct" => {
                let r = hex_to_okyct(args[0].as_str().unwrap()).unwrap();
                let exp = parse_okyct_json(expected.unwrap());
                assert_near(r.h, exp.h, 1e-9, &ctx);
                assert_near(r.c, exp.c, 1e-9, &ctx);
                assert_near(r.t, exp.t, 1e-9, &ctx);
            }
            "rgbToOkyct" => {
                let r = rgb_to_okyct(parse_rgb_json(&args[0])).unwrap();
                let exp = parse_okyct_json(expected.unwrap());
                assert_near(r.h, exp.h, 1e-9, &ctx);
                assert_near(r.c, exp.c, 1e-9, &ctx);
                assert_near(r.t, exp.t, 1e-9, &ctx);
            }
            "rgbToHex" => {
                let r = rgb_to_hex(parse_rgb_json(&args[0])).unwrap();
                assert_eq!(r, expected.unwrap().as_str().unwrap(), "{ctx}");
            }
            "getDeltaEOklab" => {
                let r = get_delta_e_oklab(args[0].as_str().unwrap(), args[1].as_str().unwrap())
                    .unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-12, &ctx);
            }
            "getDeltaE2000" => {
                let r = get_delta_e_2000(args[0].as_str().unwrap(), args[1].as_str().unwrap())
                    .unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-12, &ctx);
            }
            "simulateCvd" => {
                let cvd = CvdType::parse(args[1].as_str().unwrap()).unwrap();
                let sev = args[2].as_f64().unwrap();
                let r = simulate_cvd(args[0].as_str().unwrap(), cvd, sev).unwrap();
                assert_eq!(r, expected.unwrap().as_str().unwrap(), "{ctx}");
            }
            "shortestHueDelta" => {
                let r = shortest_hue_delta(args[0].as_f64().unwrap(), args[1].as_f64().unwrap())
                    .unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-12, &ctx);
            }
            "findGamutCusp" => {
                let gamut = GamutTarget::parse(
                    args[1].get("gamut").unwrap().as_str().unwrap(),
                )
                .unwrap();
                let r = find_gamut_cusp(args[0].as_f64().unwrap(), gamut).unwrap();
                let exp = expected.unwrap();
                assert_near(r.tone, exp.get("tone").unwrap().as_f64().unwrap(), 1e-9, &ctx);
                assert_near(r.chroma, exp.get("chroma").unwrap().as_f64().unwrap(), 1e-9, &ctx);
            }
            "findMaxChromaForTone" => {
                let gamut = GamutTarget::parse(
                    args[2].get("gamut").unwrap().as_str().unwrap(),
                )
                .unwrap();
                let r = find_max_chroma_for_tone(
                    args[0].as_f64().unwrap(),
                    args[1].as_f64().unwrap(),
                    gamut,
                )
                .unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-9, &ctx);
            }
            "isInGamut" => {
                let gamut = GamutTarget::parse(
                    args[1].get("gamut").unwrap().as_str().unwrap(),
                )
                .unwrap();
                let r = is_in_gamut(parse_okyct_json(&args[0]), gamut).unwrap();
                let exp = expected.unwrap();
                assert_eq!(r.in_gamut, exp.get("inGamut").unwrap().as_bool().unwrap(), "{ctx}");
                let exp_rgb = parse_rgb_json(exp.get("rgb").unwrap());
                assert_near(r.rgb.r, exp_rgb.r, 1e-9, &ctx);
                assert_near(r.rgb.g, exp_rgb.g, 1e-9, &ctx);
                assert_near(r.rgb.b, exp_rgb.b, 1e-9, &ctx);
            }
            "isInSrgbGamut" => {
                let coord = if args.len() == 3 {
                    Okyct::new(
                        args[0].as_f64().unwrap(),
                        args[1].as_f64().unwrap(),
                        args[2].as_f64().unwrap(),
                    )
                } else {
                    parse_okyct_json(&args[0])
                };
                let r = is_in_srgb_gamut(coord).unwrap();
                let exp = expected.unwrap();
                assert_eq!(r.in_gamut, exp.get("inGamut").unwrap().as_bool().unwrap(), "{ctx}");
            }
            "okyctToRgb" => {
                let gamut = args[1]
                    .get("gamut")
                    .and_then(|v| v.as_str())
                    .map(|s| GamutTarget::parse(s).unwrap())
                    .unwrap_or_default();
                let mode = args[1]
                    .get("gamutMapping")
                    .and_then(|v| v.as_str())
                    .map(|s| GamutMappingMode::parse(s).unwrap())
                    .unwrap_or_default();
                let res = okyct_to_rgb(
                    parse_okyct_json(&args[0]),
                    ColorConversionOptions::new(gamut, mode),
                );
                if throws {
                    assert!(res.is_err(), "{ctx} expected error");
                } else {
                    let r = res.unwrap();
                    let exp = parse_rgb_json(expected.unwrap());
                    assert_near(r.r, exp.r, 1e-9, &ctx);
                    assert_near(r.g, exp.g, 1e-9, &ctx);
                    assert_near(r.b, exp.b, 1e-9, &ctx);
                }
            }
            "okyctToHex" => {
                let gamut = args[1]
                    .get("gamut")
                    .and_then(|v| v.as_str())
                    .map(|s| GamutTarget::parse(s).unwrap())
                    .unwrap_or_default();
                let mode = args[1]
                    .get("gamutMapping")
                    .and_then(|v| v.as_str())
                    .map(|s| GamutMappingMode::parse(s).unwrap())
                    .unwrap_or_default();
                let res = okyct_to_hex(
                    parse_okyct_json(&args[0]),
                    ColorConversionOptions::new(gamut, mode),
                );
                if throws {
                    assert!(res.is_err(), "{ctx} expected error");
                } else {
                    assert_eq!(res.unwrap(), expected.unwrap().as_str().unwrap(), "{ctx}");
                }
            }
            "okyctToDisplayP3Css" => {
                let mode = args[1]
                    .get("gamutMapping")
                    .and_then(|v| v.as_str())
                    .map(|s| GamutMappingMode::parse(s).unwrap())
                    .unwrap_or_default();
                let r = okyct_to_display_p3_css(parse_okyct_json(&args[0]), mode).unwrap();
                assert_eq!(r, expected.unwrap().as_str().unwrap(), "{ctx}");
            }
            "okyctToOklchCss" => {
                let r = okyct_to_oklch_css(parse_okyct_json(&args[0])).unwrap();
                assert_eq!(r, expected.unwrap().as_str().unwrap(), "{ctx}");
            }
            "toneToY" => {
                let r = tone_to_y(args[0].as_f64().unwrap()).unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-12, &ctx);
            }
            "yToTone" => {
                let r = y_to_tone(args[0].as_f64().unwrap()).unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-12, &ctx);
            }
            "getContrastRatio" => {
                let r = get_contrast_ratio(parse_tone_input(&args[0]), parse_tone_input(&args[1]))
                    .unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-12, &ctx);
            }
            "getApcaContrast" => {
                let r = get_apca_contrast(parse_tone_input(&args[0]), parse_tone_input(&args[1]))
                    .unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-12, &ctx);
            }
            "solveTonesForApca" => {
                let res =
                    solve_tones_for_apca(parse_tone_input(&args[0]), args[1].as_f64().unwrap());
                if throws {
                    assert!(res.is_err(), "{ctx} expected error");
                } else {
                    let r = res.unwrap();
                    let exp = expected.unwrap();
                    assert_eq!(
                        r.dark_foreground_tone,
                        exp.get("darkForegroundTone").unwrap().as_f64(),
                        "{ctx} dark"
                    );
                    assert_eq!(
                        r.light_foreground_tone,
                        exp.get("lightForegroundTone").unwrap().as_f64(),
                        "{ctx} light"
                    );
                }
            }
            "solveTonesForContrast" => {
                let metric = args[2]
                    .get("metric")
                    .and_then(|v| v.as_str())
                    .map(|s| ContrastMetric::parse(s).unwrap())
                    .unwrap_or_default();
                let target_lc = args[2].get("targetLc").and_then(|v| v.as_f64());
                let res = solve_tones_for_contrast(
                    parse_tone_input(&args[0]),
                    args[1].as_f64().unwrap(),
                    ContrastSolveOptions { metric, target_lc },
                );
                if throws {
                    assert!(res.is_err(), "{ctx} expected error");
                } else {
                    let r = res.unwrap();
                    let exp = expected.unwrap();
                    assert_eq!(
                        r.dark_foreground_tone,
                        exp.get("darkForegroundTone").unwrap().as_f64(),
                        "{ctx} dark"
                    );
                    assert_eq!(
                        r.light_foreground_tone,
                        exp.get("lightForegroundTone").unwrap().as_f64(),
                        "{ctx} light"
                    );
                }
            }
            "srgbToLinear" => {
                let r = srgb_to_linear(args[0].as_f64().unwrap()).unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-12, &ctx);
            }
            "linearToSrgb" => {
                let r = linear_to_srgb(args[0].as_f64().unwrap()).unwrap();
                assert_near(r, expected.unwrap().as_f64().unwrap(), 1e-12, &ctx);
            }
            "invariants" => {
                let results = run_colorimetric_invariant_suite();
                let exp_arr = expected.unwrap().as_array().unwrap();
                assert_eq!(results.len(), exp_arr.len());
                for (actual, exp) in results.iter().zip(exp_arr.iter()) {
                    assert_eq!(actual.id, exp.get("id").unwrap().as_str().unwrap());
                    assert_eq!(actual.name, exp.get("name").unwrap().as_str().unwrap());
                    assert_eq!(actual.formula, exp.get("formula").unwrap().as_str().unwrap());
                    assert_eq!(actual.passed, exp.get("passed").unwrap().as_bool().unwrap());
                    assert_eq!(
                        actual.threshold,
                        exp.get("threshold").unwrap().as_str().unwrap()
                    );
                    assert_eq!(
                        actual.samples_checked,
                        exp.get("samplesChecked").unwrap().as_f64().unwrap() as usize
                    );
                    assert_eq!(actual.details, exp.get("details").unwrap().as_str().unwrap());
                }
            }
            "palettes" => {
                let seed = args[0].as_str().unwrap();
                let variant = PaletteVariant::parse(args[1].as_str().unwrap()).unwrap();
                let palettes = create_palettes_from_source(
                    seed,
                    CreatePalettesOptions {
                        variant,
                        gamut: GamutTarget::DisplayP3,
                        ..Default::default()
                    },
                )
                .unwrap();
                let exp_arr = expected.unwrap().as_array().unwrap();
                for (key, exp) in StandardPaletteKey::ALL.iter().zip(exp_arr.iter()) {
                    let p = palettes.get(*key);
                    assert_near(p.hue, exp.get("hue").unwrap().as_f64().unwrap(), 1e-9, &ctx);
                    assert_near(
                        p.target_chroma,
                        exp.get("targetChroma").unwrap().as_f64().unwrap(),
                        1e-9,
                        &ctx,
                    );
                    let exp_tones = exp.get("tones").unwrap().as_array().unwrap();
                    for (t_val, et) in [4.5, 40.0, 99.0].iter().zip(exp_tones.iter()) {
                        assert_eq!(p.tone(*t_val).unwrap(), et.as_str().unwrap(), "{ctx}");
                    }
                    assert_eq!(
                        p.tone_css(42.25, CssColorFormat::DisplayP3).unwrap(),
                        exp.get("p3Css").unwrap().as_str().unwrap(),
                        "{ctx}"
                    );
                }
            }
            "stack" => {
                let layers: Vec<ColorLayer> = args[0]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|l| ColorLayer {
                        color: l.get("color").unwrap().as_str().unwrap().to_string(),
                        opacity: l.get("opacity").unwrap().as_f64().unwrap(),
                        label: l.get("label").and_then(|v| v.as_str()).map(ToString::to_string),
                    })
                    .collect();
                let space = match args[1].as_str().unwrap() {
                    "linear-srgb" => BlendSpace::LinearSrgb,
                    "gamma-srgb" => BlendSpace::GammaSrgb,
                    "okyct" => BlendSpace::Okyct,
                    other => panic!("unknown space {other}"),
                };
                let res = stack_layers(StackOptions { blend_space: space }, &layers, "#128").unwrap();
                let exp = expected.unwrap();
                assert_eq!(res.final_hex, exp.get("finalHex").unwrap().as_str().unwrap(), "{ctx}");
                let exp_okyct = parse_okyct_json(exp.get("finalOkyct").unwrap());
                assert_near(res.final_okyct.h, exp_okyct.h, 1e-9, &ctx);
                assert_near(res.final_okyct.c, exp_okyct.c, 1e-9, &ctx);
                assert_near(res.final_okyct.t, exp_okyct.t, 1e-9, &ctx);
            }
            "cssMix" => {
                let layers: Vec<ColorLayer> = args[0]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|l| ColorLayer {
                        color: l.get("color").unwrap().as_str().unwrap().to_string(),
                        opacity: l.get("opacity").unwrap().as_f64().unwrap(),
                        label: None,
                    })
                    .collect();
                let res = stack_to_css_color_mix(CssColorMixSpace::Oklch, &layers, "var(--surface)")
                    .unwrap();
                assert_eq!(res, expected.unwrap().as_str().unwrap(), "{ctx}");
            }
            "stackStates" => {
                let base = args[0].get("base").unwrap().as_str().unwrap();
                let state_color = args[0].get("stateColor").unwrap().as_str().unwrap();
                let res = stack_state_layers(
                    &[
                        StackStateInput::Hover,
                        StackStateInput::Pressed,
                        StackStateInput::Dragged,
                    ],
                    base,
                    state_color,
                )
                .unwrap();
                assert_eq!(
                    res.final_hex,
                    expected.unwrap().get("finalHex").unwrap().as_str().unwrap(),
                    "{ctx}"
                );
            }
            "stackAudit" => {
                let base = args[0].get("base").unwrap().as_str().unwrap();
                let state_color = args[0].get("stateColor").unwrap().as_str().unwrap();
                let fg = args[1].as_str().unwrap();
                let stacked = stack_state_layers(
                    &[
                        StackStateInput::Hover,
                        StackStateInput::Pressed,
                        StackStateInput::Dragged,
                    ],
                    base,
                    state_color,
                )
                .unwrap();
                let report = audit_stacked_contrast(fg, &stacked).unwrap();
                let exp = expected.unwrap();
                assert_near(
                    report.wcag_ratio,
                    exp.get("wcagRatio").unwrap().as_f64().unwrap(),
                    1e-9,
                    &ctx,
                );
                assert_eq!(
                    report.apca_lc,
                    exp.get("apcaLc").unwrap().as_f64().unwrap(),
                    "{ctx}"
                );
                assert_eq!(
                    report.recommended_compensation_tone,
                    exp.get("recommendedCompensationTone").unwrap().as_f64(),
                    "{ctx}"
                );
            }
            "quantize" => {
                let data: Vec<u8> = args[0]
                    .get("data")
                    .unwrap()
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|v| v.as_f64().unwrap() as u8)
                    .collect();
                let width = args[0].get("width").unwrap().as_f64().unwrap() as usize;
                let height = args[0].get("height").unwrap().as_f64().unwrap() as usize;
                let mode = ImageQuantizerMode::parse(args[1].as_str().unwrap()).unwrap();
                let res = extract_seeds_from_image_data(
                    ImagePixelBuffer {
                        data: &data,
                        width: Some(width),
                        height: Some(height),
                    },
                    ExtractSeedsOptions {
                        mode,
                        ..Default::default()
                    },
                )
                .unwrap();
                let exp_arr = expected.unwrap().as_array().unwrap();
                assert_eq!(res.len(), exp_arr.len(), "{ctx}");
                for (a, e) in res.iter().zip(exp_arr.iter()) {
                    assert_eq!(a.hex, e.get("hex").unwrap().as_str().unwrap(), "{ctx}");
                    assert_near(
                        a.salience_score,
                        e.get("salienceScore").unwrap().as_f64().unwrap(),
                        1e-9,
                        &ctx,
                    );
                }
            }
            "scheme" => {
                let seed = args[0].as_str().unwrap();
                let profile = EmissivePanelType::parse(args[1].as_str().unwrap()).unwrap();
                let mode = ThemeMode::parse(args[2].as_str().unwrap()).unwrap();
                let palettes = create_palettes_from_source(
                    seed,
                    CreatePalettesOptions {
                        gamut: GamutTarget::DisplayP3,
                        ..Default::default()
                    },
                )
                .unwrap();
                let scheme = build_dynamic_scheme_from_palettes(
                    &palettes,
                    &BuildSchemeOptions {
                        mode,
                        contrast_level: 0.6,
                        emissive: EmissiveSchemeOptions {
                            profile,
                            burn_in_guard: true,
                            anti_fringing: true,
                            abl_guard: true,
                        },
                        state_layers: StateLayersOption::Selected(vec![
                            StateLayerState::Pressed,
                            StateLayerState::Dragged,
                        ]),
                        state_layers_contrast_guard: true,
                        ..Default::default()
                    },
                )
                .unwrap();
                let exp = expected.unwrap();
                let exp_colors = exp.get("colors").unwrap();
                for token in SystemColorToken::ALL {
                    assert_eq!(
                        scheme.get(token),
                        exp_colors.get(token.as_str()).unwrap().as_str().unwrap(),
                        "{ctx} token {}",
                        token.as_str()
                    );
                }
                let exp_sl = exp.get("stateLayers").unwrap().to_btreemap_str();
                assert_eq!(scheme.state_layers.as_ref().unwrap(), &exp_sl, "{ctx} stateLayers");
            }
            "themeTokens" => {
                let tokens = theme.tokens(ThemeMode::Dark, true, true).unwrap();
                let exp_obj = expected.unwrap().as_object().unwrap();
                assert_eq!(tokens.len(), exp_obj.len(), "{ctx} len");
                for ((ak, av), (ek, ev)) in tokens.iter().zip(exp_obj.iter()) {
                    assert_eq!(ak, ek, "{ctx} key");
                    assert_eq!(av, ev.as_str().unwrap(), "{ctx} val for {ak}");
                }
            }
            "themeCustomColors" => {
                let exp_arr = expected.unwrap().as_array().unwrap();
                assert_eq!(theme.custom_colors.dark.len(), exp_arr.len());
                for (a, e) in theme.custom_colors.dark.iter().zip(exp_arr.iter()) {
                    assert_eq!(a.name, e.get("name").unwrap().as_str().unwrap());
                    assert_eq!(a.color, e.get("color").unwrap().as_str().unwrap());
                    assert_eq!(a.on_color, e.get("onColor").unwrap().as_str().unwrap());
                    assert_eq!(
                        a.color_container,
                        e.get("colorContainer").unwrap().as_str().unwrap()
                    );
                    assert_eq!(
                        a.on_color_container,
                        e.get("onColorContainer").unwrap().as_str().unwrap()
                    );
                    assert_near(
                        a.wcag_ratio_color,
                        e.get("wcagRatioColor").unwrap().as_f64().unwrap(),
                        1e-9,
                        &ctx,
                    );
                }
            }
            "contrastAudit" => {
                let actual = theme.audit_contrast(ThemeMode::Dark).unwrap();
                let exp_arr = expected.unwrap().as_array().unwrap();
                assert_eq!(actual.len(), exp_arr.len());
                for (a, e) in actual.iter().zip(exp_arr.iter()) {
                    assert_eq!(a.fg_role.as_str(), e.get("fgRole").unwrap().as_str().unwrap());
                    assert_eq!(a.bg_role.as_str(), e.get("bgRole").unwrap().as_str().unwrap());
                    assert_near(a.wcag_ratio, e.get("wcagRatio").unwrap().as_f64().unwrap(), 1e-9, &ctx);
                    assert_eq!(a.apca_lc, e.get("apcaLc").unwrap().as_f64().unwrap());
                }
            }
            "cvdAudit" => {
                let actual =
                    audit_scheme_cvd(theme.scheme(ThemeMode::Dark), &AuditSchemeCvdOptions::default())
                        .unwrap();
                let exp_arr = expected.unwrap().as_array().unwrap();
                assert_eq!(actual.len(), exp_arr.len());
                for (a, e) in actual.iter().zip(exp_arr.iter()) {
                    assert_eq!(a.role_a.as_str(), e.get("roleA").unwrap().as_str().unwrap());
                    assert_eq!(a.role_b.as_str(), e.get("roleB").unwrap().as_str().unwrap());
                    assert_eq!(a.cvd_type.as_str(), e.get("cvdType").unwrap().as_str().unwrap());
                    assert_near(
                        a.delta_e_oklab,
                        e.get("deltaEOklab").unwrap().as_f64().unwrap(),
                        1e-9,
                        &ctx,
                    );
                    assert_eq!(a.separable, e.get("separable").unwrap().as_bool().unwrap());
                }
            }
            "telemetry" => {
                let actual = theme.analyze_emissive(ThemeMode::Dark).unwrap();
                let exp = expected.unwrap();
                assert_eq!(
                    actual.estimated_total_power_mw,
                    exp.get("estimatedTotalPowerMw").unwrap().as_f64().unwrap(),
                    "{ctx}"
                );
                assert_eq!(
                    actual.min_wcag_contrast_after_opt,
                    exp.get("minWcagContrastAfterOpt").unwrap().as_f64().unwrap(),
                    "{ctx}"
                );
            }
            "pixelTelemetry" => {
                let actual =
                    compute_color_emissive_telemetry(args[0].as_str().unwrap()).unwrap();
                let exp = expected.unwrap();
                assert_eq!(actual.is_pixel_off, exp.get("isPixelOff").unwrap().as_bool().unwrap(), "{ctx}");
                assert_eq!(actual.emitter_state.as_str(), exp.get("emitterState").unwrap().as_str().unwrap(), "{ctx}");
                assert_near(actual.power_mw, exp.get("powerMw").unwrap().as_f64().unwrap(), 1e-9, &ctx);
            }
            "exportJson" => {
                let output = theme
                    .export(&ExportThemeOptions {
                        format: TokenExportFormat::W3c,
                        state_layers: Some(StateLayersOption::Selected(vec![StateLayerState::Pressed])),
                        color_format: CssColorFormat::Hex,
                        ..Default::default()
                    })
                    .unwrap();
                assert!(!output.contains('\r'), "{ctx} must use LF only");
                let parsed = parse_json(&output).unwrap();
                assert_json_equal_with_eps(&parsed, expected.unwrap(), &ctx);
            }
            "exportHash" => {
                let format = match args[0].as_str().unwrap() {
                    "css" => TokenExportFormat::Css,
                    "tailwind" => TokenExportFormat::Tailwind,
                    "w3c" => TokenExportFormat::W3c,
                    "ts" => TokenExportFormat::Ts,
                    other => panic!("unknown format {other}"),
                };
                let color_format = CssColorFormat::parse(args[1].as_str().unwrap()).unwrap();
                let css_scheme_mode = match args[2].as_str().unwrap() {
                    "class" => CssSchemeMode::Class,
                    _ => CssSchemeMode::LightDark,
                };
                let output = theme
                    .export(&ExportThemeOptions {
                        format,
                        css_scheme_mode,
                        state_layers: Some(StateLayersOption::Selected(vec![StateLayerState::Pressed])),
                        color_format,
                        ..Default::default()
                    })
                    .unwrap();
                assert!(!output.contains('\r'), "{ctx} must use LF only");
                let hash = sha256_hex(output.as_bytes());
                assert_eq!(hash, expected.unwrap().as_str().unwrap(), "{ctx} SHA-256 mismatch");
            }
            "tokenOperators" => {
                let source = okyct::TokenDictionary::from_entries(
                    args[0]
                        .as_object()
                        .unwrap()
                        .iter()
                        .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
                        .collect(),
                );
                let reference = okyct::TokenDictionary::from_entries(
                    args[1]
                        .as_object()
                        .unwrap()
                        .iter()
                        .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
                        .collect(),
                );
                let styled = with_prefix("ui", &rename_case(NamingCase::Kebab, &source).unwrap());
                let nested = nest_tokens("-", &source).unwrap();
                let round_trip = flatten_tokens("-", &nested).unwrap();
                let picked = pick_tokens(&["blue", "neutral"], &source);
                let omitted = omit_tokens(&["blue"], &source);
                let filtered = filter_tokens(&source, |k, _| k.contains("neutral"));
                let mapped = map_tokens(&source, |v, _| with_alpha(0.5, v).unwrap());
                let css = to_css_rule_block(" :root ", &styled).unwrap();
                let variable = to_css_var_ref(Some("--ui"), Some("#fff"), "--PrimaryAccent").unwrap();
                let contract = validate_contract(&["PrimaryAccent", "missing"], &source);
                let diff = diff_theme_parity(&reference, &source);
                let optimized =
                    optimize_for_oled(EmissivePanelType::AmoledAntiSmear, true, false, &source)
                        .unwrap();
                let guarded = limit_blue_emission(0.22, 3.0, "#0000ff").unwrap();
                let power = audit_oled_power(320.0, 65.0, &source).unwrap();

                let exp = expected.unwrap();
                assert_eq!(
                    styled.into_entries(),
                    exp.get("styled")
                        .unwrap()
                        .as_object()
                        .unwrap()
                        .iter()
                        .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
                        .collect::<Vec<_>>()
                );
                assert_eq!(
                    round_trip.into_entries(),
                    exp.get("roundTrip")
                        .unwrap()
                        .as_object()
                        .unwrap()
                        .iter()
                        .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
                        .collect::<Vec<_>>()
                );
                assert_eq!(picked.len(), exp.get("picked").unwrap().as_object().unwrap().len());
                assert_eq!(omitted.len(), exp.get("omitted").unwrap().as_object().unwrap().len());
                assert_eq!(filtered.len(), exp.get("filtered").unwrap().as_object().unwrap().len());
                assert_eq!(
                    mapped.get("blue").unwrap(),
                    exp.get("mapped").unwrap().get("blue").unwrap().as_str().unwrap()
                );
                assert_eq!(css, exp.get("css").unwrap().as_str().unwrap());
                assert_eq!(variable, exp.get("variable").unwrap().as_str().unwrap());
                assert_eq!(contract.valid, exp.get("contract").unwrap().get("valid").unwrap().as_bool().unwrap());
                assert_eq!(diff.is_symmetric, exp.get("diff").unwrap().get("isSymmetric").unwrap().as_bool().unwrap());
                assert_eq!(
                    optimized.get("blue").unwrap(),
                    exp.get("optimized").unwrap().get("blue").unwrap().as_str().unwrap()
                );
                assert_eq!(guarded, exp.get("guarded").unwrap().as_str().unwrap());
                let exp_power = exp.get("power").unwrap();
                assert_eq!(
                    power.true_black_token_count,
                    exp_power.get("trueBlackTokenCount").unwrap().as_f64().unwrap() as usize
                );
                assert_eq!(
                    power.near_black_token_count,
                    exp_power.get("nearBlackTokenCount").unwrap().as_f64().unwrap() as usize
                );
                assert_eq!(
                    power.total_tokens_evaluated,
                    exp_power.get("totalTokensEvaluated").unwrap().as_f64().unwrap() as usize
                );
                assert_near(
                    power.average_power_mw,
                    exp_power.get("averagePowerMw").unwrap().as_f64().unwrap(),
                    1e-9,
                    &ctx,
                );
            }
            other => panic!("Unhandled fixture api: {other}"),
        }
    }
}
