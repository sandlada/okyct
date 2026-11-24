use std::collections::HashMap;

use crate::domain::models::{CssColorFormat, OkyctError};
use crate::ports::inbound::{
    DynamicSchemeColors, ResolvedCustomColor, STANDARD_TONES, StandardPaletteKey, StateLayersOption,
    SystemColorToken, TonalPalettePort,
};
use crate::ports::outbound::{CssSchemeMode, ExportCssVariablesOptions};
use super::internal::assert_no_token_collision::register_token_key;
use super::internal::format_export_color::{format_color_value, format_scheme_token};
use super::internal::kebab_case::kebab_case;
use super::internal::resolve_export_state_layers::{
    resolve_custom_state_layers_for_export, resolve_system_state_layers_for_export,
};

fn custom_tuple(
    color: &ResolvedCustomColor,
    color_format: CssColorFormat,
    state_layers: Option<&StateLayersOption>,
) -> Result<Vec<(String, String)>, OkyctError> {
    let k = kebab_case(&color.name);
    if k.is_empty() {
        return Err(OkyctError::new(format!(
            "Invalid custom color name: \"{}\". Expected at least one alphanumeric word.",
            color.name
        )));
    }

    let resolved = resolve_custom_state_layers_for_export(color, state_layers)?;
    let mut pairs = Vec::new();

    pairs.push((
        format!("--md-custom-color-{k}"),
        format_color_value(&color.color, color_format, None)?,
    ));
    for (state, hex) in resolved.color_states {
        pairs.push((
            format!("--md-custom-color-{k}-{}", state.as_str()),
            format_color_value(&hex, color_format, None)?,
        ));
    }

    pairs.push((
        format!("--md-custom-color-on-{k}"),
        format_color_value(&color.on_color, color_format, None)?,
    ));
    for (state, hex) in resolved.on_color_states {
        pairs.push((
            format!("--md-custom-color-on-{k}-{}", state.as_str()),
            format_color_value(&hex, color_format, None)?,
        ));
    }

    pairs.push((
        format!("--md-custom-color-{k}-container"),
        format_color_value(&color.color_container, color_format, None)?,
    ));
    for (state, hex) in resolved.container_states {
        pairs.push((
            format!("--md-custom-color-{k}-container-{}", state.as_str()),
            format_color_value(&hex, color_format, None)?,
        ));
    }

    pairs.push((
        format!("--md-custom-color-on-{k}-container"),
        format_color_value(&color.on_color_container, color_format, None)?,
    ));
    for (state, hex) in resolved.on_container_states {
        pairs.push((
            format!("--md-custom-color-on-{k}-container-{}", state.as_str()),
            format_color_value(&hex, color_format, None)?,
        ));
    }

    Ok(pairs)
}

pub fn export_css_variables<P: TonalPalettePort>(
    light_scheme: &DynamicSchemeColors,
    dark_scheme: &DynamicSchemeColors,
    options: &ExportCssVariablesOptions<P>,
) -> Result<String, OkyctError> {
    let color_format = options.base.color_format;
    let state_layers = options.base.state_layers.as_ref();
    let custom_light = &options.base.custom_colors_light;
    let custom_dark = &options.base.custom_colors_dark;

    let format_entries = |scheme: &DynamicSchemeColors, indent: &str| -> Result<String, OkyctError> {
        let mut lines = Vec::new();
        for key in SystemColorToken::ALL {
            lines.push(format!(
                "{indent}--md-sys-color-{}: {};",
                kebab_case(key.as_str()),
                format_scheme_token(scheme, key, color_format)?
            ));
        }
        for (key, value) in resolve_system_state_layers_for_export(scheme, state_layers)? {
            lines.push(format!(
                "{indent}--md-sys-color-{}: {};",
                kebab_case(&key),
                format_color_value(&value, color_format, None)?
            ));
        }
        Ok(lines.join("\n"))
    };

    let format_custom_entries =
        |customs: &[ResolvedCustomColor], indent: &str| -> Result<String, OkyctError> {
            if customs.is_empty() {
                return Ok(String::new());
            }
            let mut custom_keys = HashMap::new();
            let mut lines = Vec::new();
            for c in customs {
                let source_label = format!("custom color \"{}\"", c.name);
                for (name, value) in custom_tuple(c, color_format, state_layers)? {
                    register_token_key(
                        &mut custom_keys,
                        &name,
                        &source_label,
                        "exportCssVariables",
                    )?;
                    lines.push(format!("{indent}{name}: {value};"));
                }
            }
            Ok(format!(
                "\n\n  /* -------------------------------------------------------------\n     Custom Extended Semantic Colors\n     ------------------------------------------------------------- */\n{}",
                lines.join("\n")
            ))
        };

    let palette_entries = |indent: &str| -> Result<String, OkyctError> {
        let Some(palettes) = &options.palettes else {
            return Ok(String::new());
        };
        let mut list = Vec::new();
        for key in StandardPaletteKey::ALL {
            for t in STANDARD_TONES {
                list.push(format!(
                    "{indent}--md-ref-palette-{}-{t}: {};",
                    kebab_case(key.as_str()),
                    palettes.get(key).tone_css(t as f64, color_format)?
                ));
            }
        }
        Ok(list.join("\n"))
    };

    let header = "/* ==========================================================================\n   Generated by OKYCT Studio (Production Design Tokens)\n   ========================================================================== */";

    let palette_block = if options.palettes.is_some() {
        format!(
            "  /* -------------------------------------------------------------\n     Reference Tonal Palettes (13 Standard Stops)\n     ------------------------------------------------------------- */\n{}",
            palette_entries("  ")?
        )
    } else {
        String::new()
    };

    if options.scheme_mode == CssSchemeMode::LightDark {
        let dark_by_name: HashMap<&str, &ResolvedCustomColor> =
            custom_dark.iter().map(|c| (c.name.as_str(), c)).collect();

        let mut system_lines = Vec::new();
        for key in SystemColorToken::ALL {
            system_lines.push(format!(
                "  --md-sys-color-{}: light-dark({}, {});",
                kebab_case(key.as_str()),
                format_scheme_token(light_scheme, key, color_format)?,
                format_scheme_token(dark_scheme, key, color_format)?
            ));
        }

        let light_states = resolve_system_state_layers_for_export(light_scheme, state_layers)?;
        let dark_states_map: HashMap<String, String> =
            resolve_system_state_layers_for_export(dark_scheme, state_layers)?
                .into_iter()
                .collect();
        for (key, light_val) in light_states {
            let dark_val = dark_states_map.get(&key).map(String::as_str).unwrap_or(&light_val);
            system_lines.push(format!(
                "  --md-sys-color-{}: light-dark({}, {});",
                kebab_case(&key),
                format_color_value(&light_val, color_format, None)?,
                format_color_value(dark_val, color_format, None)?
            ));
        }

        let mut custom_keys = HashMap::new();
        let mut custom_lines = Vec::new();
        for color in custom_light {
            let dark = dark_by_name.get(color.name.as_str()).copied().unwrap_or(color);
            let dark_slots: HashMap<String, String> =
                custom_tuple(dark, color_format, state_layers)?
                    .into_iter()
                    .collect();
            let source_label = format!("custom color \"{}\"", color.name);
            for (name, value) in custom_tuple(color, color_format, state_layers)? {
                register_token_key(
                    &mut custom_keys,
                    &name,
                    &source_label,
                    "exportCssVariables",
                )?;
                let dark_value = dark_slots.get(&name).map(String::as_str).unwrap_or(&value);
                custom_lines.push(format!("  {name}: light-dark({value}, {dark_value});"));
            }
        }

        let custom_block = if custom_lines.is_empty() {
            String::new()
        } else {
            format!(
                "\n\n  /* -------------------------------------------------------------\n     Custom Extended Semantic Colors\n     ------------------------------------------------------------- */\n{}",
                custom_lines.join("\n")
            )
        };
        let palette_section = if palette_block.is_empty() {
            String::new()
        } else {
            format!("\n{palette_block}\n")
        };

        return Ok(format!(
            "{header}\n\n:root {{\n  color-scheme: light dark;\n{palette_section}\n  /* -------------------------------------------------------------\n     System Colors — light-dark(light, dark)\n     ------------------------------------------------------------- */\n{}{custom_block}\n}}\n",
            system_lines.join("\n")
        ));
    }

    let root_palette_section = if palette_block.is_empty() {
        String::new()
    } else {
        format!("\n:root {{\n{palette_block}\n}}\n")
    };

    Ok(format!(
        "{header}\n{root_palette_section}\n.light {{\n  /* -------------------------------------------------------------\n     Light Scheme System Colors\n     ------------------------------------------------------------- */\n{}{}\n}}\n\n.dark {{\n  /* -------------------------------------------------------------\n     Dark Scheme System Colors\n     ------------------------------------------------------------- */\n{}{}\n}}\n",
        format_entries(light_scheme, "  ")?,
        format_custom_entries(custom_light, "  ")?,
        format_entries(dark_scheme, "  ")?,
        format_custom_entries(custom_dark, "  ")?
    ))
}
