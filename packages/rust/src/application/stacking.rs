use std::f64::consts::PI;
use crate::domain::models::{
    ColorConversionOptions, ColorToneInput, ContrastMetric, ContrastSolveOptions, Okyct,
    OkyctError, Rgb,
};
use crate::domain::services::{
    get_apca_contrast, get_contrast_ratio, hex_to_rgb, linear_to_srgb, okyct_to_rgb, rgb_to_hex,
    rgb_to_okyct, solve_tones_for_contrast, srgb_to_linear, trim_ascii_whitespace,
};
use crate::ports::inbound::{
    BlendSpace, ColorLayer, CompositedResult, CssColorMixSpace, LayerStepTrace, StackOptions,
    StackStateInput, StackedContrastReport,
};

#[derive(Debug, Clone, Copy)]
struct BlendState {
    rgb: Rgb,
    alpha: f64,
}

fn blend_state(
    fg_rgb: Rgb,
    fg_alpha: f64,
    bg: BlendState,
    blend_space: BlendSpace,
) -> Result<BlendState, OkyctError> {
    let a_fg = fg_alpha.clamp(0.0, 1.0);
    let a_bg = bg.alpha.clamp(0.0, 1.0);
    let a_out = a_fg + a_bg * (1.0 - a_fg);

    if a_out <= 0.0 {
        return Ok(BlendState {
            rgb: Rgb::new(0.0, 0.0, 0.0),
            alpha: 0.0,
        });
    }

    let w_fg = a_fg / a_out;
    let w_bg = (a_bg * (1.0 - a_fg)) / a_out;

    match blend_space {
        BlendSpace::Okyct => {
            let fg_okyct = rgb_to_okyct(fg_rgb)?;
            let bg_okyct = rgb_to_okyct(bg.rgb)?;

            let fg_rad = fg_okyct.h * PI / 180.0;
            let bg_rad = bg_okyct.h * PI / 180.0;

            let a_mix = fg_okyct.c * fg_rad.cos() * w_fg + bg_okyct.c * bg_rad.cos() * w_bg;
            let b_mix = fg_okyct.c * fg_rad.sin() * w_fg + bg_okyct.c * bg_rad.sin() * w_bg;

            let mut h_out = b_mix.atan2(a_mix) * 180.0 / PI;
            if h_out < 0.0 {
                h_out += 360.0;
            }

            let c_out = a_mix.hypot(b_mix);
            let t_out = fg_okyct.t * w_fg + bg_okyct.t * w_bg;

            Ok(BlendState {
                rgb: okyct_to_rgb(Okyct::new(h_out, c_out, t_out), ColorConversionOptions::default())?,
                alpha: a_out,
            })
        }
        BlendSpace::LinearSrgb => {
            let r_lin = srgb_to_linear(fg_rgb.r)? * w_fg + srgb_to_linear(bg.rgb.r)? * w_bg;
            let g_lin = srgb_to_linear(fg_rgb.g)? * w_fg + srgb_to_linear(bg.rgb.g)? * w_bg;
            let b_lin = srgb_to_linear(fg_rgb.b)? * w_fg + srgb_to_linear(bg.rgb.b)? * w_bg;

            Ok(BlendState {
                rgb: Rgb::new(
                    linear_to_srgb(r_lin)?.clamp(0.0, 1.0),
                    linear_to_srgb(g_lin)?.clamp(0.0, 1.0),
                    linear_to_srgb(b_lin)?.clamp(0.0, 1.0),
                ),
                alpha: a_out,
            })
        }
        BlendSpace::GammaSrgb => Ok(BlendState {
            rgb: Rgb::new(
                (fg_rgb.r * w_fg + bg.rgb.r * w_bg).clamp(0.0, 1.0),
                (fg_rgb.g * w_fg + bg.rgb.g * w_bg).clamp(0.0, 1.0),
                (fg_rgb.b * w_fg + bg.rgb.b * w_bg).clamp(0.0, 1.0),
            ),
            alpha: a_out,
        }),
    }
}

pub fn stack_layers(
    options: StackOptions,
    layers: &[ColorLayer],
    base_color: &str,
) -> Result<CompositedResult, OkyctError> {
    let blend_space = options.blend_space;
    let mut traces = Vec::with_capacity(layers.len() + 1);

    let mut state = BlendState {
        rgb: hex_to_rgb(base_color)?,
        alpha: 1.0,
    };
    let mut current_hex = rgb_to_hex(state.rgb)?;
    let mut current_okyct = rgb_to_okyct(state.rgb)?;

    traces.push(LayerStepTrace {
        step_index: 0,
        label: "Base".to_string(),
        layer_color: base_color.to_string(),
        layer_opacity: 1.0,
        accumulated_hex: current_hex.clone(),
        accumulated_okyct: current_okyct,
        wcag_contrast_with_white: get_contrast_ratio(
            ColorToneInput::Tone(current_okyct.t),
            ColorToneInput::Tone(100.0),
        )?,
        wcag_contrast_with_black: get_contrast_ratio(
            ColorToneInput::Tone(current_okyct.t),
            ColorToneInput::Tone(0.0),
        )?,
    });

    for (i, layer) in layers.iter().enumerate() {
        if !layer.opacity.is_finite() {
            return Err(OkyctError::new(format!(
                "Invalid layer opacity at index {i}: {}. Expected a finite number.",
                layer.opacity
            )));
        }
        state = blend_state(hex_to_rgb(&layer.color)?, layer.opacity, state, blend_space)?;
        current_hex = rgb_to_hex(state.rgb)?;
        current_okyct = rgb_to_okyct(state.rgb)?;

        traces.push(LayerStepTrace {
            step_index: i + 1,
            label: layer
                .label
                .as_deref()
                .filter(|s| !s.is_empty())
                .map(ToString::to_string)
                .unwrap_or_else(|| format!("Layer {}", i + 1)),
            layer_color: layer.color.clone(),
            layer_opacity: layer.opacity,
            accumulated_hex: current_hex.clone(),
            accumulated_okyct: current_okyct,
            wcag_contrast_with_white: get_contrast_ratio(
                ColorToneInput::Tone(current_okyct.t),
                ColorToneInput::Tone(100.0),
            )?,
            wcag_contrast_with_black: get_contrast_ratio(
                ColorToneInput::Tone(current_okyct.t),
                ColorToneInput::Tone(0.0),
            )?,
        });
    }

    Ok(CompositedResult {
        base_color: base_color.to_string(),
        total_layers: layers.len(),
        final_hex: current_hex,
        final_okyct: current_okyct,
        traces,
        blend_space,
    })
}

fn state_input_info(state: StackStateInput) -> (&'static str, f64) {
    match state {
        StackStateInput::Hovered => ("HOVERED", 0.08),
        StackStateInput::Hover => ("HOVER", 0.08),
        StackStateInput::Focused => ("FOCUSED", 0.12),
        StackStateInput::Focus => ("FOCUS", 0.12),
        StackStateInput::Pressed => ("PRESSED", 0.12),
        StackStateInput::Dragged => ("DRAGGED", 0.16),
    }
}

pub fn stack_state_layers(
    states: &[StackStateInput],
    base: &str,
    state_color: &str,
) -> Result<CompositedResult, OkyctError> {
    let layers: Vec<ColorLayer> = states
        .iter()
        .map(|&s| {
            let (name, opacity) = state_input_info(s);
            let pct = (opacity * 100.0 + 0.5).floor() as i64;
            ColorLayer {
                color: state_color.to_string(),
                opacity,
                label: Some(format!("{name} State Layer ({pct}%)")),
            }
        })
        .collect();

    stack_layers(
        StackOptions {
            blend_space: BlendSpace::Okyct,
        },
        &layers,
        base,
    )
}

#[inline]
fn round_to(val: f64, factor: f64) -> f64 {
    (val * factor + 0.5 * val.signum()).trunc() / factor
}

pub fn audit_stacked_contrast(
    foreground_hex: &str,
    composited: &CompositedResult,
) -> Result<StackedContrastReport, OkyctError> {
    let fg_okyct = rgb_to_okyct(hex_to_rgb(foreground_hex)?)?;
    let bg_okyct = composited.final_okyct;
    let base_okyct = composited
        .traces
        .first()
        .map(|t| t.accumulated_okyct)
        .unwrap_or(bg_okyct);

    let wcag_ratio = get_contrast_ratio(
        ColorToneInput::Tone(fg_okyct.t),
        ColorToneInput::Tone(bg_okyct.t),
    )?;
    let apca_lc = get_apca_contrast(
        ColorToneInput::Tone(fg_okyct.t),
        ColorToneInput::Tone(bg_okyct.t),
    )?
    .abs();
    let delta_tone = bg_okyct.t - base_okyct.t;

    let wcag_pass_aa = wcag_ratio >= 4.5;
    let wcag_pass_aaa = wcag_ratio >= 7.0;

    let mut warning_message = None;
    let mut recommended_compensation_tone = None;

    if !wcag_pass_aa || apca_lc < 60.0 {
        let sign = if delta_tone > 0.0 { "+" } else { "" };
        warning_message = Some(format!(
            "Warning: after {} composited layers, background Tone shifted by ΔT={sign}{:.1}, reducing contrast to WCAG {:.2}:1 / APCA Lc {apca_lc}.",
            composited.total_layers, delta_tone, wcag_ratio
        ));
        let solved = solve_tones_for_contrast(
            ColorToneInput::Tone(bg_okyct.t),
            4.5,
            ContrastSolveOptions {
                metric: ContrastMetric::Both,
                target_lc: Some(60.0),
            },
        )?;
        recommended_compensation_tone = if fg_okyct.t > bg_okyct.t {
            solved.light_foreground_tone
        } else {
            solved.dark_foreground_tone
        };
    }

    Ok(StackedContrastReport {
        foreground_hex: foreground_hex.to_string(),
        final_background_hex: composited.final_hex.clone(),
        wcag_ratio: round_to(wcag_ratio, 100.0),
        wcag_pass_aa,
        wcag_pass_aaa,
        apca_lc,
        delta_tone_from_base: (delta_tone * 10.0).round() / 10.0,
        warning_message,
        recommended_compensation_tone,
    })
}

pub fn stack_to_css_color_mix(
    space: CssColorMixSpace,
    layers: &[ColorLayer],
    base_expr: &str,
) -> Result<String, OkyctError> {
    if trim_ascii_whitespace(base_expr).is_empty() {
        return Err(OkyctError::new(
            "Invalid baseExpr for stackToCssColorMix: expected a non-empty string.",
        ));
    }
    let mut current_expr = base_expr.to_string();

    for (i, layer) in layers.iter().enumerate() {
        if trim_ascii_whitespace(&layer.color).is_empty() {
            return Err(OkyctError::new(format!(
                "Invalid layer color at index {i}: expected a non-empty string."
            )));
        }
        if !layer.opacity.is_finite() {
            return Err(OkyctError::new(format!(
                "Invalid layer opacity at index {i}: {}. Expected a finite number.",
                layer.opacity
            )));
        }
        let clamped = layer.opacity.clamp(0.0, 1.0);
        let pct = ((clamped * 100.0) * 100.0).round() / 100.0;
        let remain_pct = ((100.0 - pct) * 100.0).round() / 100.0;
        current_expr = format!(
            "color-mix(in {}, {current_expr} {remain_pct}%, {} {pct}%)",
            space.as_str(),
            layer.color
        );
    }

    Ok(current_expr)
}
