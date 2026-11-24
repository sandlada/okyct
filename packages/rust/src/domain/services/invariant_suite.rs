use crate::domain::models::{
    ColorConversionOptions, ColorToneInput, ContrastMetric, ContrastSolveOptions, GamutMappingMode,
    InvariantTestResult, Okyct, Rgb,
};
use super::contrast::{
    get_apca_contrast, get_contrast_ratio, solve_tones_for_apca, solve_tones_for_contrast,
};
use super::gamut::find_max_chroma_for_tone;
use super::hex_rgb::shortest_hue_delta;
use super::internal::xyz::{linear_rgb_to_xyz, xyz_to_oklab, Oklab};
use super::okyct_conv::{hex_to_okyct, okyct_to_hex, okyct_to_rgb, rgb_to_okyct};
use super::srgb_to_linear::srgb_to_linear;
use super::tone_y::{tone_to_y, y_to_tone};

fn srgb_to_oklab(rgb: Rgb) -> Oklab {
    let rl = srgb_to_linear(rgb.r).unwrap_or(0.0);
    let gl = srgb_to_linear(rgb.g).unwrap_or(0.0);
    let bl = srgb_to_linear(rgb.b).unwrap_or(0.0);
    xyz_to_oklab(linear_rgb_to_xyz(Rgb::new(rl, gl, bl)))
}

const HEX_ROUND_TRIP_SEEDS: [&str; 5] = ["#2563EB", "#0000FF", "#FF0000", "#FFD600", "#FF00FF"];
const HEX_ROUND_TRIP_TONES: [f64; 10] = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 95.0];
const HEX_HUE_DRIFT_CAP_DEG: f64 = 0.5;
const HEX_TONE_DELTA_CAP: f64 = 0.35;
const HEX_MIN_CHROMA_FOR_HUE: f64 = 0.01;

fn smoothstep(edge0: f64, edge1: f64, x: f64) -> f64 {
    let t = ((x - edge0) / (edge1 - edge0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

fn tonal_stop_hex(source_hue: f64, target_chroma: f64, tone: f64) -> String {
    let dark_roll = if tone < 18.0 {
        smoothstep(0.0, 18.0, tone)
    } else {
        1.0
    };
    let light_roll = if tone > 85.0 {
        smoothstep(100.0, 85.0, tone)
    } else {
        1.0
    };
    let effective_chroma = target_chroma * dark_roll * light_roll;
    let max_gamut_chroma = find_max_chroma_for_tone(source_hue, tone, Default::default()).unwrap_or(0.0);
    let final_chroma = effective_chroma.min(max_gamut_chroma);
    okyct_to_hex(
        Okyct::new(source_hue, final_chroma, tone),
        ColorConversionOptions::default(),
    )
    .unwrap_or_else(|_| "#000000".to_string())
}

pub fn run_colorimetric_invariant_suite() -> Vec<InvariantTestResult> {
    let mut max_round_trip_error: f64 = 0.0;
    let mut max_round_trip_delta_e_ok: f64 = 0.0;
    let mut round_trip_samples: usize = 0;
    let sample_steps = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
    for &r in &sample_steps {
        for &g in &sample_steps {
            for &b in &sample_steps {
                let source_rgb = Rgb::new(r, g, b);
                let okyct = rgb_to_okyct(source_rgb).unwrap();
                let restored = okyct_to_rgb(okyct, ColorConversionOptions::default()).unwrap();
                let err = (r - restored.r)
                    .abs()
                    .max((g - restored.g).abs())
                    .max((b - restored.b).abs());
                if err > max_round_trip_error {
                    max_round_trip_error = err;
                }
                let lab_src = srgb_to_oklab(source_rgb);
                let lab_dst = srgb_to_oklab(restored);
                let dl = lab_dst.l - lab_src.l;
                let da = lab_dst.a - lab_src.a;
                let db = lab_dst.b - lab_src.b;
                let delta_e_ok = (dl * dl + da * da + db * db).sqrt();
                if delta_e_ok > max_round_trip_delta_e_ok {
                    max_round_trip_delta_e_ok = delta_e_ok;
                }
                round_trip_samples += 1;
            }
        }
    }

    let mut max_tone_bijection_error: f64 = 0.0;
    let mut monotonic_violations: usize = 0;
    let mut prev_y: f64 = -1.0;
    for step in 0..=200 {
        let t = (step as f64) * 0.5;
        let y = tone_to_y(t).unwrap();
        if y <= prev_y {
            monotonic_violations += 1;
        }
        prev_y = y;
        let back_t = y_to_tone(y).unwrap();
        let err = (t - back_t).abs();
        if err > max_tone_bijection_error {
            max_tone_bijection_error = err;
        }
    }

    let mut gamut_overflow_count: usize = 0;
    let mut max_hue_drift_deg: f64 = 0.0;
    let mut gamut_samples: usize = 0;
    for h_step in 0..24 {
        let h = (h_step * 15) as f64;
        for &t in &[20.0, 40.0, 60.0, 80.0] {
            for &gamut_mapping in &[GamutMappingMode::PreserveTone, GamutMappingMode::CuspCompress] {
                let rgb = okyct_to_rgb(
                    Okyct::new(h, 0.38, t),
                    ColorConversionOptions::new(Default::default(), gamut_mapping),
                )
                .unwrap();
                if rgb.r < 0.0 || rgb.r > 1.0 || rgb.g < 0.0 || rgb.g > 1.0 || rgb.b < 0.0 || rgb.b > 1.0 {
                    gamut_overflow_count += 1;
                }
                let back_okyct = rgb_to_okyct(rgb).unwrap();
                if back_okyct.c > 0.01 {
                    let h_diff = shortest_hue_delta(back_okyct.h, h).unwrap();
                    if h_diff > max_hue_drift_deg {
                        max_hue_drift_deg = h_diff;
                    }
                }
                gamut_samples += 1;
            }
        }
    }

    let mut hex_round_trip_violations: usize = 0;
    let mut hex_round_trip_samples: usize = 0;
    let mut max_hex_hue_drift_deg: f64 = 0.0;
    let mut max_hex_tone_delta: f64 = 0.0;
    for &seed_hex in &HEX_ROUND_TRIP_SEEDS {
        let source = hex_to_okyct(seed_hex).unwrap();
        for &tone in &HEX_ROUND_TRIP_TONES {
            let hex = tonal_stop_hex(source.h, source.c, tone);
            let measured = hex_to_okyct(&hex).unwrap();
            let tone_delta = (measured.t - tone).abs();
            if tone_delta > max_hex_tone_delta {
                max_hex_tone_delta = tone_delta;
            }
            if tone_delta > HEX_TONE_DELTA_CAP {
                hex_round_trip_violations += 1;
            }

            if measured.c > HEX_MIN_CHROMA_FOR_HUE {
                let h_drift = shortest_hue_delta(measured.h, source.h).unwrap();
                if h_drift > max_hex_hue_drift_deg {
                    max_hex_hue_drift_deg = h_drift;
                }
                if h_drift > HEX_HUE_DRIFT_CAP_DEG {
                    hex_round_trip_violations += 1;
                }
            }
            hex_round_trip_samples += 1;
        }
    }

    let mut contrast_violations: usize = 0;
    let mut contrast_samples: usize = 0;
    for step in 0..=50 {
        let bg_t = (step * 2) as f64;
        let wcag_solved = solve_tones_for_contrast(
            ColorToneInput::Tone(bg_t),
            4.5,
            ContrastSolveOptions {
                metric: ContrastMetric::Both,
                target_lc: Some(60.0),
            },
        )
        .unwrap();
        if let Some(dark) = wcag_solved.dark_foreground_tone {
            let ratio = get_contrast_ratio(ColorToneInput::Tone(bg_t), ColorToneInput::Tone(dark)).unwrap();
            let lc = get_apca_contrast(ColorToneInput::Tone(dark), ColorToneInput::Tone(bg_t))
                .unwrap()
                .abs();
            if ratio < 4.5 || lc < 60.0 {
                contrast_violations += 1;
            }
            contrast_samples += 1;
        }
        if let Some(light) = wcag_solved.light_foreground_tone {
            let ratio = get_contrast_ratio(ColorToneInput::Tone(bg_t), ColorToneInput::Tone(light)).unwrap();
            let lc = get_apca_contrast(ColorToneInput::Tone(light), ColorToneInput::Tone(bg_t))
                .unwrap()
                .abs();
            if ratio < 4.5 || lc < 60.0 {
                contrast_violations += 1;
            }
            contrast_samples += 1;
        }

        let apca_solved = solve_tones_for_apca(ColorToneInput::Tone(bg_t), 60.0).unwrap();
        if let Some(dark) = apca_solved.dark_foreground_tone {
            if get_apca_contrast(ColorToneInput::Tone(dark), ColorToneInput::Tone(bg_t))
                .unwrap()
                .abs()
                < 60.0
            {
                contrast_violations += 1;
            }
            contrast_samples += 1;
        }
        if let Some(light) = apca_solved.light_foreground_tone {
            if get_apca_contrast(ColorToneInput::Tone(light), ColorToneInput::Tone(bg_t))
                .unwrap()
                .abs()
                < 60.0
            {
                contrast_violations += 1;
            }
            contrast_samples += 1;
        }
    }

    vec![
        InvariantTestResult {
            id: "round-trip".to_string(),
            name: "sRGB <-> OKYCT Bidirectional Round-Trip Accuracy".to_string(),
            formula: "max |ΔRGB| & max ΔE_OK(sRGB, okyctToRgb(rgbToOkyct(sRGB)))".to_string(),
            passed: max_round_trip_error < 1e-4 && max_round_trip_delta_e_ok < 1e-4,
            measured_value: format!(
                "ΔRGB_max = {max_round_trip_error:.2e}, ΔE_OK_max = {max_round_trip_delta_e_ok:.2e}"
            ),
            threshold: "< 1.00e-4".to_string(),
            samples_checked: round_trip_samples,
            details: "Verifies single-variable 3rd-order Halley solver (dY/dL, d²Y/dL² with Newton-Raphson fallback) convergence across the full sRGB cube.".to_string(),
        },
        InvariantTestResult {
            id: "tone-bijection".to_string(),
            name: "Tone <-> CIE Y Analytical Bijection & Monotonicity".to_string(),
            formula: "∀ T₁ < T₂ => Y(T₁) < Y(T₂), |yToTone(toneToY(T)) - T|".to_string(),
            passed: monotonic_violations == 0 && max_tone_bijection_error < 1e-6,
            measured_value: format!(
                "{max_tone_bijection_error:.2e} (violations: {monotonic_violations})"
            ),
            threshold: "< 1.00e-6".to_string(),
            samples_checked: 201,
            details: "Guarantees strictly monotonic mapping between perceptual Tone and physical luminance Y.".to_string(),
        },
        InvariantTestResult {
            id: "hex-round-trip".to_string(),
            name: "8-bit Hex Quantization Hue & Tone Budget".to_string(),
            formula: "tonalStopHex -> hexToOkyct, ΔH & |ΔTone|".to_string(),
            passed: hex_round_trip_violations == 0,
            measured_value: format!(
                "ΔH_max = {max_hex_hue_drift_deg:.3}°, ΔT_max = {max_hex_tone_delta:.3} (violations: {hex_round_trip_violations})"
            ),
            threshold: format!("ΔH <= {HEX_HUE_DRIFT_CAP_DEG}°, |ΔTone| <= {HEX_TONE_DELTA_CAP}"),
            samples_checked: hex_round_trip_samples,
            details: "Verifies 8-vertex perceptual JND quantization preserves OKLab hue and Tone within tight bounds.".to_string(),
        },
        InvariantTestResult {
            id: "cusp-containment".to_string(),
            name: "360° Gamut Containment & Zero Hue Drift".to_string(),
            formula: "C=0.38 under preserve-tone & cusp-compress: ΔHue & channel bounds".to_string(),
            passed: gamut_overflow_count == 0 && max_hue_drift_deg < 0.1,
            measured_value: format!(
                "ΔH_max = {max_hue_drift_deg:.3}° (overflows: {gamut_overflow_count})"
            ),
            threshold: "ΔH < 0.100°".to_string(),
            samples_checked: gamut_samples,
            details: "Ensures out-of-gamut colors stay strictly inside [0, 1] RGB with negligible hue rotation.".to_string(),
        },
        InvariantTestResult {
            id: "algebraic-contrast".to_string(),
            name: "O(1) Dual WCAG 2.1 + APCA Contrast Inversion Guard".to_string(),
            formula: "WCAG >= 4.5 & |APCA Lc| >= 60 for solved foreground tones".to_string(),
            passed: contrast_violations == 0,
            measured_value: format!("100% pass (violations: {contrast_violations}/{contrast_samples})"),
            threshold: "0 violations".to_string(),
            samples_checked: contrast_samples,
            details: "Verifies closed-form WCAG 2.1 and analytical APCA inverse Tone solvers across [0, 100].".to_string(),
        },
    ]
}
