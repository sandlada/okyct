use std::collections::BTreeMap;

use crate::domain::models::{
    ColorToneInput, ContrastMetric, ContrastSolveOptions, OkyctError,
};
use crate::domain::services::{
    get_apca_contrast, get_contrast_ratio, hex_to_okyct, shortest_hue_delta,
    solve_tones_for_contrast, trim_ascii_whitespace,
};
use crate::ports::inbound::{
    CustomColorInput, ResolveCustomColorsOptions, ResolvedCustomColor, ThemeMode,
    TonalPaletteOptions,
};
use super::harmonize::harmonize_hex;
use super::internal::composite_guarded_state_hex::composite_guarded_state_hex;
use super::internal::scheme_token_role_map::{format_state_layer_key, normalize_state_layer_states};
use super::tonal_palette::TonalPalette;

fn meets_target(
    fg_hex: &str,
    bg_hex: &str,
    min_ratio: f64,
    min_apca: f64,
    metric: ContrastMetric,
) -> Result<bool, OkyctError> {
    if metric != ContrastMetric::Apca
        && get_contrast_ratio(ColorToneInput::Hex(fg_hex), ColorToneInput::Hex(bg_hex))? < min_ratio
    {
        return Ok(false);
    }
    if metric != ContrastMetric::Wcag
        && get_apca_contrast(ColorToneInput::Hex(fg_hex), ColorToneInput::Hex(bg_hex))?.abs()
            < min_apca
    {
        return Ok(false);
    }
    Ok(true)
}

fn resolve_foreground_hex(
    palette: &TonalPalette,
    initial_tone: f64,
    bg_hex: &str,
    prefer_light: bool,
    min_ratio: f64,
    min_apca: f64,
    metric: ContrastMetric,
) -> Result<String, OkyctError> {
    let mut tone = initial_tone;
    let mut fg_hex = palette.tone(tone)?;
    if meets_target(&fg_hex, bg_hex, min_ratio, min_apca, metric)? {
        return Ok(fg_hex);
    }

    let solved = solve_tones_for_contrast(
        ColorToneInput::Hex(bg_hex),
        min_ratio,
        ContrastSolveOptions {
            metric,
            target_lc: Some(min_apca),
        },
    )?;
    tone = if prefer_light {
        solved.light_foreground_tone.unwrap_or(100.0)
    } else {
        solved.dark_foreground_tone.unwrap_or(0.0)
    };
    fg_hex = palette.tone(tone)?;

    for _ in 0..20 {
        if meets_target(&fg_hex, bg_hex, min_ratio, min_apca, metric)? {
            break;
        }
        tone = if prefer_light {
            (tone + 0.5).min(100.0)
        } else {
            (tone - 0.5).max(0.0)
        };
        fg_hex = palette.tone(tone)?;
        if tone <= 0.0 || tone >= 100.0 {
            break;
        }
    }

    Ok(fg_hex)
}

pub fn resolve_custom_colors(
    configs: &[CustomColorInput],
    primary_seed_hex: &str,
    options: &ResolveCustomColorsOptions,
) -> Result<Vec<ResolvedCustomColor>, OkyctError> {
    if !options.contrast_level.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid contrastLevel: {}. Expected a finite number in [-1.0, 1.0].",
            options.contrast_level
        )));
    }

    let is_dark = options.mode == ThemeMode::Dark;
    let clamped_contrast = options.contrast_level.clamp(-1.0, 1.0);
    let target_ratio = if clamped_contrast >= 0.8 {
        7.0
    } else if clamped_contrast >= 0.35 {
        5.8
    } else {
        4.5
    };
    let target_apca = if clamped_contrast >= 0.8 {
        75.0
    } else if clamped_contrast >= 0.35 {
        65.0
    } else {
        60.0
    };
    let requested_states = normalize_state_layer_states(&options.state_layers);

    let mut results = Vec::with_capacity(configs.len());
    for cfg in configs {
        let name = trim_ascii_whitespace(&cfg.name);
        let has_ident = name
            .bytes()
            .any(|b| !matches!(b, b'-' | b'_' | b' ' | b'\t' | b'\n' | b'\r' | 0x0C));
        if name.is_empty() || !has_ident {
            return Err(OkyctError::new(
                "Invalid custom color name: expected a non-empty identifier string.",
            ));
        }

        let id = match &cfg.id {
            Some(raw_id) => {
                let t = trim_ascii_whitespace(raw_id);
                if t.is_empty() {
                    return Err(OkyctError::new(
                        "Invalid custom color id: expected a non-empty string when provided.",
                    ));
                }
                t.to_string()
            }
            None => name.to_string(),
        };

        let label = match &cfg.label {
            Some(raw_label) => {
                let t = trim_ascii_whitespace(raw_label);
                if t.is_empty() {
                    return Err(OkyctError::new(
                        "Invalid custom color label: expected a non-empty string when provided.",
                    ));
                }
                t.to_string()
            }
            None => name.to_string(),
        };

        let harmonize = cfg.harmonize.unwrap_or(true);
        let orig_okyct = hex_to_okyct(&cfg.source_hex)?;
        let effective_hex = if harmonize {
            harmonize_hex(&cfg.source_hex, primary_seed_hex, 18.0)?
        } else {
            cfg.source_hex.clone()
        };

        let harm_okyct = hex_to_okyct(&effective_hex)?;
        let hue_diff = shortest_hue_delta(harm_okyct.h, orig_okyct.h)?;
        let palette = TonalPalette::from_hex(&effective_hex, TonalPaletteOptions::default())?;

        let color_tone = if is_dark {
            if clamped_contrast > 0.3 { 86.0 } else { 80.0 }
        } else if clamped_contrast > 0.3 {
            32.0
        } else {
            40.0
        };
        let container_tone = if is_dark { 30.0 } else { 90.0 };

        let color_hex = palette.tone(color_tone)?;
        let container_hex = palette.tone(container_tone)?;

        let on_color_hex = resolve_foreground_hex(
            &palette,
            if is_dark { 20.0 } else { 100.0 },
            &color_hex,
            !is_dark,
            target_ratio,
            target_apca,
            options.contrast_metric,
        )?;
        let on_container_hex = resolve_foreground_hex(
            &palette,
            if is_dark { 90.0 } else { 10.0 },
            &container_hex,
            is_dark,
            target_ratio,
            target_apca,
            options.contrast_metric,
        )?;

        let wcag_color = get_contrast_ratio(
            ColorToneInput::Hex(&on_color_hex),
            ColorToneInput::Hex(&color_hex),
        )?;
        let wcag_container = get_contrast_ratio(
            ColorToneInput::Hex(&on_container_hex),
            ColorToneInput::Hex(&container_hex),
        )?;
        let apca_color = get_apca_contrast(
            ColorToneInput::Hex(&on_color_hex),
            ColorToneInput::Hex(&color_hex),
        )?
        .abs();
        let apca_container = get_apca_contrast(
            ColorToneInput::Hex(&on_container_hex),
            ColorToneInput::Hex(&container_hex),
        )?
        .abs();

        let state_layers = if requested_states.is_empty() {
            None
        } else {
            let mut map = BTreeMap::new();
            for &state in &requested_states {
                map.insert(
                    format_state_layer_key("color", state),
                    composite_guarded_state_hex(
                        &color_hex,
                        &on_color_hex,
                        state,
                        options.state_layers_blend_space,
                        options.state_layers_contrast_guard,
                    )?,
                );
                map.insert(
                    format_state_layer_key("onColor", state),
                    composite_guarded_state_hex(
                        &on_color_hex,
                        &color_hex,
                        state,
                        options.state_layers_blend_space,
                        options.state_layers_contrast_guard,
                    )?,
                );
                map.insert(
                    format_state_layer_key("colorContainer", state),
                    composite_guarded_state_hex(
                        &container_hex,
                        &on_container_hex,
                        state,
                        options.state_layers_blend_space,
                        options.state_layers_contrast_guard,
                    )?,
                );
                map.insert(
                    format_state_layer_key("onColorContainer", state),
                    composite_guarded_state_hex(
                        &on_container_hex,
                        &container_hex,
                        state,
                        options.state_layers_blend_space,
                        options.state_layers_contrast_guard,
                    )?,
                );
            }
            Some(map)
        };

        results.push(ResolvedCustomColor {
            id,
            name: name.to_string(),
            label,
            source_hex: cfg.source_hex.clone(),
            harmonized_hex: effective_hex,
            hue_shift_deg: (hue_diff * 10.0).round() / 10.0,
            color: color_hex,
            on_color: on_color_hex,
            color_container: container_hex,
            on_color_container: on_container_hex,
            wcag_ratio_color: (wcag_color * 100.0).round() / 100.0,
            wcag_ratio_container: (wcag_container * 100.0).round() / 100.0,
            apca_lc_color: apca_color,
            apca_lc_container: apca_container,
            state_layers,
        });
    }

    Ok(results)
}
