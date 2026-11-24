use std::collections::BTreeMap;

use crate::domain::models::{
    ColorToneInput, ContrastMetric, ContrastSolveOptions, GamutTarget, Okyct, OkyctError,
};
use crate::domain::services::{
    get_apca_contrast, get_contrast_ratio, hex_to_okyct, solve_tones_for_contrast, tone_to_y,
};
use crate::ports::inbound::{
    AmbientSurround, BuildDynamicSchemeOptions, DynamicSchemeColors, EmissivePanelType, PaletteSet,
    SystemColorToken, ThemeMode, TonalPalettePort,
};
use crate::ports::outbound::{DisplayPhysicsPort, EmissiveRoleKind, default_panel_spec};
use super::internal::refine_tone_for_contrast::refine_tone_for_contrast;
use super::internal::scheme_token_role_map::{
    SchemeRoleKind, normalize_state_layer_states, scheme_token_role,
};
use super::state_layers::{
    ResolveSchemeStateLayersOptions, resolve_scheme_state_layers_ordered,
};

struct ContrastPairSpec {
    fg: SystemColorToken,
    bg: SystemColorToken,
    min_ratio: f64,
    min_apca: f64,
}

fn meets_contrast(
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

#[inline]
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

fn to_emissive_role_kind(kind: SchemeRoleKind) -> EmissiveRoleKind {
    match kind {
        SchemeRoleKind::Surface => EmissiveRoleKind::Surface,
        SchemeRoleKind::Foreground => EmissiveRoleKind::Foreground,
        SchemeRoleKind::Accent => EmissiveRoleKind::Accent,
    }
}

pub fn build_dynamic_scheme_with_physics<P: TonalPalettePort>(
    palettes: &PaletteSet<P>,
    options: &BuildDynamicSchemeOptions,
    physics_port: Option<&dyn DisplayPhysicsPort>,
) -> Result<DynamicSchemeColors, OkyctError> {
    if !options.contrast_level.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid contrastLevel: {}. Expected a finite number in [-1.0, 1.0].",
            options.contrast_level
        )));
    }

    let profile = options.emissive.profile;
    let burn_in_guard = options.emissive.burn_in_guard;
    let anti_fringing = options.emissive.anti_fringing;
    let abl_guard = options.emissive.abl_guard;

    let is_dark = options.mode == ThemeMode::Dark;
    let base_c = options.contrast_level.clamp(-1.0, 1.0);
    let c = if options.ambient == AmbientSurround::Bright {
        (base_c + 0.35).min(1.0)
    } else {
        base_c
    };

    let panel_spec = match physics_port {
        Some(port) => port.get_panel_spec(profile),
        None => default_panel_spec(profile),
    };

    let ambient_peak_cap = if options.ambient == AmbientSurround::Darkroom {
        90.0
    } else {
        100.0
    };
    let peak_white_cap = panel_spec.light_peak_tone_cap.min(ambient_peak_cap);
    let raw_fg_cap = if anti_fringing {
        match profile {
            EmissivePanelType::MicroOledXr => peak_white_cap.min(92.0),
            EmissivePanelType::AmoledAntiSmear => peak_white_cap.min(97.0),
            _ => peak_white_cap,
        }
    } else {
        peak_white_cap
    };
    let fg_highlight_cap = if options.ambient == AmbientSurround::Darkroom {
        raw_fg_cap.min(88.0)
    } else {
        raw_fg_cap
    };

    let adjust_tone = |base_tone: f64, lighten: bool, delta: f64| -> f64 {
        if c == 0.0 {
            return base_tone;
        }
        let factor = if c > 0.0 { c } else { c * 0.5 };
        if lighten {
            peak_white_cap.min(js_round(base_tone + delta * factor))
        } else {
            0.0_f64.max(js_round(base_tone - delta * factor))
        }
    };

    let light_surface_cap = (if options.ambient == AmbientSurround::Darkroom {
        90.0_f64
    } else {
        98.0_f64
    })
    .min(if profile == EmissivePanelType::MicroOledXr {
        94.0
    } else {
        98.0
    });

    let dark_floor_lift = if options.ambient == AmbientSurround::Bright {
        2.0
    } else {
        0.0
    };
    let df_lowest = panel_spec.dark_surface_tones.lowest + dark_floor_lift;
    let df_surface = panel_spec.dark_surface_tones.surface + dark_floor_lift;
    let df_low = panel_spec.dark_surface_tones.low + dark_floor_lift;
    let df_container = panel_spec.dark_surface_tones.container + dark_floor_lift;
    let df_high = panel_spec.dark_surface_tones.high + dark_floor_lift;
    let df_highest = panel_spec.dark_surface_tones.highest + dark_floor_lift;
    let df_bright = panel_spec.dark_surface_tones.bright + dark_floor_lift;

    let mut tones: BTreeMap<SystemColorToken, f64> = BTreeMap::new();
    if !is_dark {
        tones.insert(SystemColorToken::Primary, adjust_tone(40.0, false, 12.0));
        tones.insert(SystemColorToken::OnPrimary, fg_highlight_cap);
        tones.insert(SystemColorToken::PrimaryContainer, adjust_tone(90.0, true, 5.0));
        tones.insert(SystemColorToken::OnPrimaryContainer, adjust_tone(10.0, false, 6.0));
        tones.insert(SystemColorToken::PrimaryFixed, peak_white_cap.min(90.0));
        tones.insert(SystemColorToken::PrimaryFixedDim, 80.0);
        tones.insert(SystemColorToken::OnPrimaryFixed, 10.0);
        tones.insert(SystemColorToken::OnPrimaryFixedVariant, 28.0);

        tones.insert(SystemColorToken::Secondary, adjust_tone(40.0, false, 10.0));
        tones.insert(SystemColorToken::OnSecondary, fg_highlight_cap);
        tones.insert(SystemColorToken::SecondaryContainer, adjust_tone(90.0, true, 5.0));
        tones.insert(SystemColorToken::OnSecondaryContainer, adjust_tone(10.0, false, 6.0));

        tones.insert(SystemColorToken::Tertiary, adjust_tone(40.0, false, 10.0));
        tones.insert(SystemColorToken::OnTertiary, fg_highlight_cap);
        tones.insert(SystemColorToken::TertiaryContainer, adjust_tone(90.0, true, 5.0));
        tones.insert(SystemColorToken::OnTertiaryContainer, adjust_tone(10.0, false, 6.0));

        tones.insert(SystemColorToken::Error, adjust_tone(40.0, false, 10.0));
        tones.insert(SystemColorToken::OnError, fg_highlight_cap);
        tones.insert(SystemColorToken::ErrorContainer, peak_white_cap.min(90.0));
        tones.insert(SystemColorToken::OnErrorContainer, 10.0);

        tones.insert(SystemColorToken::Warning, adjust_tone(42.0, false, 10.0));
        tones.insert(SystemColorToken::OnWarning, fg_highlight_cap);
        tones.insert(SystemColorToken::WarningContainer, peak_white_cap.min(90.0));
        tones.insert(SystemColorToken::OnWarningContainer, 12.0);

        tones.insert(SystemColorToken::Success, adjust_tone(38.0, false, 10.0));
        tones.insert(SystemColorToken::OnSuccess, fg_highlight_cap);
        tones.insert(SystemColorToken::SuccessContainer, peak_white_cap.min(90.0));
        tones.insert(SystemColorToken::OnSuccessContainer, 10.0);

        tones.insert(SystemColorToken::Info, adjust_tone(40.0, false, 10.0));
        tones.insert(SystemColorToken::OnInfo, fg_highlight_cap);
        tones.insert(SystemColorToken::InfoContainer, adjust_tone(90.0, true, 5.0));
        tones.insert(SystemColorToken::OnInfoContainer, adjust_tone(10.0, false, 6.0));

        tones.insert(
            SystemColorToken::Surface,
            light_surface_cap.min(adjust_tone(98.0, true, 2.0)),
        );
        tones.insert(SystemColorToken::OnSurface, adjust_tone(10.0, false, 8.0));
        tones.insert(SystemColorToken::SurfaceVariant, adjust_tone(90.0, false, 4.0));
        tones.insert(SystemColorToken::OnSurfaceVariant, adjust_tone(30.0, false, 10.0));

        tones.insert(SystemColorToken::SurfaceDim, 87.0);
        tones.insert(SystemColorToken::SurfaceBright, light_surface_cap);
        tones.insert(
            SystemColorToken::SurfaceContainerLowest,
            if profile == EmissivePanelType::MicroOledXr {
                96.0
            } else {
                peak_white_cap
            },
        );
        tones.insert(
            SystemColorToken::SurfaceContainerLow,
            if profile == EmissivePanelType::MicroOledXr { 92.0 } else { 96.0 },
        );
        tones.insert(
            SystemColorToken::SurfaceContainer,
            if profile == EmissivePanelType::MicroOledXr { 90.0 } else { 94.0 },
        );
        tones.insert(
            SystemColorToken::SurfaceContainerHigh,
            if profile == EmissivePanelType::MicroOledXr { 88.0 } else { 92.0 },
        );
        tones.insert(
            SystemColorToken::SurfaceContainerHighest,
            if profile == EmissivePanelType::MicroOledXr { 85.0 } else { 90.0 },
        );

        tones.insert(SystemColorToken::Outline, adjust_tone(50.0, false, 15.0));
        tones.insert(SystemColorToken::OutlineVariant, adjust_tone(80.0, false, 10.0));
        tones.insert(SystemColorToken::InverseSurface, 20.0);
        tones.insert(SystemColorToken::InverseOnSurface, fg_highlight_cap.min(95.0));
        tones.insert(SystemColorToken::InversePrimary, 80.0);
        tones.insert(SystemColorToken::InverseOnPrimary, 20.0);
        tones.insert(SystemColorToken::InversePrimaryContainer, adjust_tone(30.0, false, 6.0));
        tones.insert(
            SystemColorToken::InverseOnPrimaryContainer,
            fg_highlight_cap.min(adjust_tone(90.0, true, 6.0)),
        );
        tones.insert(SystemColorToken::Scrim, 0.0);
        tones.insert(SystemColorToken::Shadow, 0.0);
    } else {
        tones.insert(
            SystemColorToken::Primary,
            peak_white_cap.min(adjust_tone(80.0, true, 12.0)),
        );
        tones.insert(SystemColorToken::OnPrimary, adjust_tone(20.0, false, 10.0));
        tones.insert(SystemColorToken::PrimaryContainer, adjust_tone(30.0, false, 6.0));
        tones.insert(
            SystemColorToken::OnPrimaryContainer,
            fg_highlight_cap.min(adjust_tone(90.0, true, 6.0)),
        );
        tones.insert(SystemColorToken::PrimaryFixed, peak_white_cap.min(90.0));
        tones.insert(SystemColorToken::PrimaryFixedDim, 80.0);
        tones.insert(SystemColorToken::OnPrimaryFixed, 10.0);
        tones.insert(SystemColorToken::OnPrimaryFixedVariant, 28.0);

        tones.insert(
            SystemColorToken::Secondary,
            peak_white_cap.min(adjust_tone(80.0, true, 10.0)),
        );
        tones.insert(SystemColorToken::OnSecondary, adjust_tone(20.0, false, 10.0));
        tones.insert(SystemColorToken::SecondaryContainer, adjust_tone(30.0, false, 6.0));
        tones.insert(
            SystemColorToken::OnSecondaryContainer,
            fg_highlight_cap.min(adjust_tone(90.0, true, 6.0)),
        );

        tones.insert(
            SystemColorToken::Tertiary,
            peak_white_cap.min(adjust_tone(80.0, true, 10.0)),
        );
        tones.insert(SystemColorToken::OnTertiary, adjust_tone(20.0, false, 10.0));
        tones.insert(SystemColorToken::TertiaryContainer, adjust_tone(30.0, false, 6.0));
        tones.insert(
            SystemColorToken::OnTertiaryContainer,
            fg_highlight_cap.min(adjust_tone(90.0, true, 6.0)),
        );

        tones.insert(
            SystemColorToken::Error,
            peak_white_cap.min(adjust_tone(80.0, true, 10.0)),
        );
        tones.insert(SystemColorToken::OnError, 20.0);
        tones.insert(SystemColorToken::ErrorContainer, 30.0);
        tones.insert(SystemColorToken::OnErrorContainer, fg_highlight_cap.min(90.0));

        tones.insert(
            SystemColorToken::Warning,
            peak_white_cap.min(adjust_tone(82.0, true, 10.0)),
        );
        tones.insert(SystemColorToken::OnWarning, 20.0);
        tones.insert(SystemColorToken::WarningContainer, 32.0);
        tones.insert(SystemColorToken::OnWarningContainer, fg_highlight_cap.min(90.0));

        tones.insert(
            SystemColorToken::Success,
            peak_white_cap.min(adjust_tone(78.0, true, 10.0)),
        );
        tones.insert(SystemColorToken::OnSuccess, 18.0);
        tones.insert(SystemColorToken::SuccessContainer, 28.0);
        tones.insert(SystemColorToken::OnSuccessContainer, fg_highlight_cap.min(90.0));

        tones.insert(
            SystemColorToken::Info,
            peak_white_cap.min(adjust_tone(80.0, true, 10.0)),
        );
        tones.insert(SystemColorToken::OnInfo, 20.0);
        tones.insert(SystemColorToken::InfoContainer, 30.0);
        tones.insert(SystemColorToken::OnInfoContainer, fg_highlight_cap.min(90.0));

        tones.insert(SystemColorToken::Surface, df_surface);
        tones.insert(
            SystemColorToken::OnSurface,
            fg_highlight_cap.min(adjust_tone(90.0, true, 8.0)),
        );
        tones.insert(SystemColorToken::SurfaceVariant, adjust_tone(30.0, true, 5.0));
        tones.insert(
            SystemColorToken::OnSurfaceVariant,
            fg_highlight_cap.min(adjust_tone(80.0, true, 10.0)),
        );

        tones.insert(SystemColorToken::SurfaceDim, df_surface);
        tones.insert(SystemColorToken::SurfaceBright, df_bright);
        tones.insert(SystemColorToken::SurfaceContainerLowest, df_lowest);
        tones.insert(SystemColorToken::SurfaceContainerLow, df_low);
        tones.insert(SystemColorToken::SurfaceContainer, df_container);
        tones.insert(SystemColorToken::SurfaceContainerHigh, df_high);
        tones.insert(SystemColorToken::SurfaceContainerHighest, df_highest);

        tones.insert(SystemColorToken::Outline, adjust_tone(60.0, true, 15.0));
        tones.insert(SystemColorToken::OutlineVariant, adjust_tone(30.0, true, 10.0));
        tones.insert(SystemColorToken::InverseSurface, peak_white_cap.min(90.0));
        tones.insert(SystemColorToken::InverseOnSurface, 20.0);
        tones.insert(SystemColorToken::InversePrimary, 40.0);
        tones.insert(SystemColorToken::InverseOnPrimary, fg_highlight_cap);
        tones.insert(SystemColorToken::InversePrimaryContainer, adjust_tone(90.0, true, 5.0));
        tones.insert(SystemColorToken::InverseOnPrimaryContainer, adjust_tone(10.0, false, 6.0));
        tones.insert(SystemColorToken::Scrim, 0.0);
        tones.insert(SystemColorToken::Shadow, 0.0);
    }

    if abl_guard && !is_dark {
        let weighted_apl = (tone_to_y(tones[&SystemColorToken::Surface])? * 0.42
            + tone_to_y(tones[&SystemColorToken::SurfaceContainerLowest])? * 0.14
            + tone_to_y(tones[&SystemColorToken::SurfaceContainerLow])? * 0.12
            + tone_to_y(tones[&SystemColorToken::SurfaceContainer])? * 0.12
            + tone_to_y(tones[&SystemColorToken::SurfaceContainerHigh])? * 0.06
            + tone_to_y(tones[&SystemColorToken::Primary])? * 0.05
            + tone_to_y(tones[&SystemColorToken::PrimaryContainer])? * 0.04
            + tone_to_y(tones[&SystemColorToken::SecondaryContainer])? * 0.02
            + tone_to_y(tones[&SystemColorToken::OnSurface])? * 0.02
            + tone_to_y(tones[&SystemColorToken::OnSurfaceVariant])? * 0.01)
            * 100.0;

        if weighted_apl > 65.0 {
            let cap = |tones: &mut BTreeMap<SystemColorToken, f64>, tok: SystemColorToken, max_v: f64| {
                if let Some(v) = tones.get_mut(&tok) {
                    *v = v.min(max_v);
                }
            };
            cap(&mut tones, SystemColorToken::Surface, 84.0);
            cap(&mut tones, SystemColorToken::SurfaceBright, 86.0);
            cap(&mut tones, SystemColorToken::SurfaceContainerLowest, 86.0);
            cap(&mut tones, SystemColorToken::SurfaceContainerLow, 83.0);
            cap(&mut tones, SystemColorToken::SurfaceContainer, 81.0);
            cap(&mut tones, SystemColorToken::SurfaceContainerHigh, 79.0);
            cap(&mut tones, SystemColorToken::SurfaceContainerHighest, 77.0);
            cap(&mut tones, SystemColorToken::SurfaceDim, 75.0);
            cap(&mut tones, SystemColorToken::SurfaceVariant, 79.0);
            cap(&mut tones, SystemColorToken::PrimaryContainer, 82.0);
            cap(&mut tones, SystemColorToken::SecondaryContainer, 82.0);
            cap(&mut tones, SystemColorToken::TertiaryContainer, 82.0);
        }
    }

    let target_text_ratio = if c >= 0.8 {
        7.0
    } else if c >= 0.35 {
        5.8
    } else {
        4.5
    };
    let target_text_apca = if c >= 0.8 {
        75.0
    } else if c >= 0.35 {
        65.0
    } else {
        60.0
    };
    let target_outline_ratio = if c >= 0.5 { 4.5 } else { 3.0 };
    let target_outline_apca = if c >= 0.5 { 60.0 } else { 45.0 };

    let pair_specs = [
        ContrastPairSpec { fg: SystemColorToken::OnPrimary, bg: SystemColorToken::Primary, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnPrimaryContainer, bg: SystemColorToken::PrimaryContainer, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnPrimaryFixed, bg: SystemColorToken::PrimaryFixed, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnPrimaryFixedVariant, bg: SystemColorToken::PrimaryFixedDim, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnSecondary, bg: SystemColorToken::Secondary, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnSecondaryContainer, bg: SystemColorToken::SecondaryContainer, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnTertiary, bg: SystemColorToken::Tertiary, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnTertiaryContainer, bg: SystemColorToken::TertiaryContainer, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnSurface, bg: SystemColorToken::Surface, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnSurface, bg: SystemColorToken::SurfaceContainer, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnSurfaceVariant, bg: SystemColorToken::SurfaceVariant, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnError, bg: SystemColorToken::Error, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnErrorContainer, bg: SystemColorToken::ErrorContainer, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnWarning, bg: SystemColorToken::Warning, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnWarningContainer, bg: SystemColorToken::WarningContainer, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnSuccess, bg: SystemColorToken::Success, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnSuccessContainer, bg: SystemColorToken::SuccessContainer, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnInfo, bg: SystemColorToken::Info, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::OnInfoContainer, bg: SystemColorToken::InfoContainer, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::InverseOnSurface, bg: SystemColorToken::InverseSurface, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::InverseOnPrimary, bg: SystemColorToken::InversePrimary, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::InverseOnPrimaryContainer, bg: SystemColorToken::InversePrimaryContainer, min_ratio: target_text_ratio, min_apca: target_text_apca },
        ContrastPairSpec { fg: SystemColorToken::Outline, bg: SystemColorToken::Surface, min_ratio: target_outline_ratio, min_apca: target_outline_apca },
    ];

    let resolve_role_hex = |palette: &P, tone: f64, role_kind: SchemeRoleKind| -> Result<String, OkyctError> {
        if tone <= 0.0 {
            return Ok("#000000".to_string());
        }
        let mut hex = palette.tone(tone)?;
        if let Some(port) = physics_port {
            if burn_in_guard && role_kind != SchemeRoleKind::Surface {
                hex = port.apply_blue_burn_in_guard(&hex, 0.22, 3.0)?;
            }
            if anti_fringing {
                hex = port.apply_subpixel_edge_compensation(
                    &hex,
                    profile,
                    to_emissive_role_kind(role_kind),
                )?;
            }
        }
        Ok(hex)
    };

    let mut resolved_colors: BTreeMap<SystemColorToken, String> = BTreeMap::new();
    for token in SystemColorToken::ALL {
        let binding = scheme_token_role(token);
        let hex = resolve_role_hex(palettes.get(binding.palette), tones[&token], binding.kind)?;
        resolved_colors.insert(token, hex);
    }

    for pair in &pair_specs {
        let mut fg_hex = resolved_colors[&pair.fg].clone();
        let bg_hex = resolved_colors[&pair.bg].clone();
        if meets_contrast(
            &fg_hex,
            &bg_hex,
            pair.min_ratio,
            pair.min_apca,
            options.contrast_metric,
        )? {
            continue;
        }

        let fg_binding = scheme_token_role(pair.fg);
        let bg_binding = scheme_token_role(pair.bg);
        let fg_palette = palettes.get(fg_binding.palette);
        let bg_palette = palettes.get(bg_binding.palette);

        let fg_measured_t = hex_to_okyct(&fg_hex)?.t;
        let bg_measured_t = hex_to_okyct(&bg_hex)?.t;
        let solved = solve_tones_for_contrast(
            ColorToneInput::Tone(bg_measured_t),
            pair.min_ratio,
            ContrastSolveOptions {
                metric: options.contrast_metric,
                target_lc: Some(pair.min_apca),
            },
        )?;

        let prefer_light_fg = fg_measured_t >= bg_measured_t;
        let fg_cap = if fg_binding.kind == SchemeRoleKind::Foreground {
            fg_highlight_cap
        } else {
            peak_white_cap
        };

        if prefer_light_fg {
            let start_fg_t = match solved.light_foreground_tone {
                Some(t) if t <= fg_cap => t,
                _ => fg_cap,
            };
            let fg_refined = refine_tone_for_contrast(
                start_fg_t,
                fg_cap,
                |t| resolve_role_hex(fg_palette, t, fg_binding.kind),
                |hex| {
                    meets_contrast(
                        hex,
                        &bg_hex,
                        pair.min_ratio,
                        pair.min_apca,
                        options.contrast_metric,
                    )
                },
                0.05,
                12,
            )?;

            tones.insert(pair.fg, fg_refined.tone);
            resolved_colors.insert(pair.fg, fg_refined.hex.clone());
            if fg_refined.passed {
                continue;
            }

            fg_hex = fg_refined.hex;
            let bg_floor = if bg_binding.kind == SchemeRoleKind::Surface && is_dark {
                df_surface
            } else {
                0.0
            };
            let bg_solved = solve_tones_for_contrast(
                ColorToneInput::Tone(hex_to_okyct(&fg_hex)?.t),
                pair.min_ratio,
                ContrastSolveOptions {
                    metric: options.contrast_metric,
                    target_lc: Some(pair.min_apca),
                },
            )?;
            let start_bg_t = match bg_solved.dark_foreground_tone {
                Some(t) => bg_floor.max(t),
                None => bg_floor,
            };
            let bg_refined = refine_tone_for_contrast(
                start_bg_t,
                bg_floor,
                |t| resolve_role_hex(bg_palette, t, bg_binding.kind),
                |hex| {
                    meets_contrast(
                        &fg_hex,
                        hex,
                        pair.min_ratio,
                        pair.min_apca,
                        options.contrast_metric,
                    )
                },
                0.05,
                12,
            )?;
            tones.insert(pair.bg, bg_refined.tone);
            resolved_colors.insert(pair.bg, bg_refined.hex);
        } else {
            let start_fg_t = solved.dark_foreground_tone.unwrap_or(0.0);
            let fg_refined = refine_tone_for_contrast(
                start_fg_t,
                0.0,
                |t| resolve_role_hex(fg_palette, t, fg_binding.kind),
                |hex| {
                    meets_contrast(
                        hex,
                        &bg_hex,
                        pair.min_ratio,
                        pair.min_apca,
                        options.contrast_metric,
                    )
                },
                0.05,
                12,
            )?;
            tones.insert(pair.fg, fg_refined.tone);
            resolved_colors.insert(pair.fg, fg_refined.hex.clone());
            if fg_refined.passed {
                continue;
            }

            let bg_solved = solve_tones_for_contrast(
                ColorToneInput::Tone(hex_to_okyct(&fg_refined.hex)?.t),
                pair.min_ratio,
                ContrastSolveOptions {
                    metric: options.contrast_metric,
                    target_lc: Some(pair.min_apca),
                },
            )?;
            if let Some(light_t) = bg_solved.light_foreground_tone
                && light_t <= peak_white_cap
            {
                let bg_refined = refine_tone_for_contrast(
                    light_t,
                    peak_white_cap,
                    |t| resolve_role_hex(bg_palette, t, bg_binding.kind),
                    |hex| {
                        meets_contrast(
                            &fg_refined.hex,
                            hex,
                            pair.min_ratio,
                            pair.min_apca,
                            options.contrast_metric,
                        )
                    },
                    0.05,
                    12,
                )?;
                tones.insert(pair.bg, bg_refined.tone);
                resolved_colors.insert(pair.bg, bg_refined.hex);
            }
        }
    }

    let mut okyct_map: BTreeMap<SystemColorToken, Okyct> = BTreeMap::new();
    let has_physics_color_transform = physics_port.is_some() && (burn_in_guard || anti_fringing);

    for token in SystemColorToken::ALL {
        let measured = hex_to_okyct(&resolved_colors[&token])?;
        tones.insert(token, (measured.t * 100.0).round() / 100.0);

        let binding = scheme_token_role(token);
        let palette = palettes.get(binding.palette);
        let target_gamut_coord = palette.tone_okyct(measured.t, Some(palette.gamut()))?;

        let coord = if has_physics_color_transform
            && (binding.kind != SchemeRoleKind::Surface || anti_fringing)
        {
            if palette.gamut() == GamutTarget::Srgb {
                measured
            } else {
                let unguarded_srgb = palette.tone_okyct(measured.t, Some(GamutTarget::Srgb))?;
                if unguarded_srgb.c > 1e-4 {
                    let chroma_scale = (measured.c / unguarded_srgb.c).min(1.0);
                    let hue_shift = (measured.h - unguarded_srgb.h + 540.0).rem_euclid(360.0) - 180.0;
                    Okyct::new(
                        (target_gamut_coord.h + hue_shift).rem_euclid(360.0),
                        target_gamut_coord.c * chroma_scale,
                        measured.t,
                    )
                } else {
                    measured
                }
            }
        } else {
            Okyct::new(target_gamut_coord.h, target_gamut_coord.c, measured.t)
        };
        okyct_map.insert(token, coord);
    }

    let mut base_scheme = DynamicSchemeColors {
        colors: resolved_colors,
        tones,
        okyct: okyct_map,
        state_layers: None,
    };

    let requested_states = normalize_state_layer_states(&options.state_layers);
    if !requested_states.is_empty() {
        let entries = resolve_scheme_state_layers_ordered(
            &base_scheme,
            &options.state_layers,
            ResolveSchemeStateLayersOptions {
                blend_space: options.state_layers_blend_space,
                contrast_guard: options.state_layers_contrast_guard,
            },
        )?;
        base_scheme.state_layers = Some(entries.into_iter().collect());
    }

    Ok(base_scheme)
}
