use std::collections::HashMap;

use crate::domain::models::{CssColorFormat, OkyctError};
use crate::ports::inbound::{
    DynamicSchemeColors, ResolvedCustomColor, StateLayersOption, SystemColorToken,
};
use crate::ports::outbound::ExportTokensBaseOptions;
use super::internal::assert_no_token_collision::register_token_key;
use super::internal::format_export_color::{format_color_value, format_scheme_token};
use super::internal::resolve_export_state_layers::{
    resolve_custom_state_layers_for_export, resolve_system_state_layers_for_export,
};
use super::internal::serialize_canonical_json::{JsonValue, serialize_canonical_json};

fn extract_tokens(
    scheme: &DynamicSchemeColors,
    color_format: CssColorFormat,
    state_layers: Option<&StateLayersOption>,
) -> Result<Vec<(String, JsonValue)>, OkyctError> {
    let mut entries = Vec::new();
    for key in SystemColorToken::ALL {
        entries.push((
            key.as_str().to_string(),
            JsonValue::String(format_scheme_token(scheme, key, color_format)?),
        ));
    }
    for (state_key, state_hex) in resolve_system_state_layers_for_export(scheme, state_layers)? {
        entries.push((
            state_key,
            JsonValue::String(format_color_value(&state_hex, color_format, None)?),
        ));
    }
    Ok(entries)
}

fn build_custom_map(
    customs: &[ResolvedCustomColor],
    color_format: CssColorFormat,
    state_layers: Option<&StateLayersOption>,
) -> Result<JsonValue, OkyctError> {
    let mut entries = Vec::new();
    let mut custom_keys = HashMap::new();
    let fmt = |hex: &str| format_color_value(hex, color_format, None);

    for c in customs {
        register_token_key(
            &mut custom_keys,
            &c.name,
            &format!("custom color \"{}\"", c.name),
            "exportTypeScriptTokens",
        )?;

        let mut entry = vec![
            ("color".to_string(), JsonValue::String(fmt(&c.color)?)),
            ("onColor".to_string(), JsonValue::String(fmt(&c.on_color)?)),
            (
                "colorContainer".to_string(),
                JsonValue::String(fmt(&c.color_container)?),
            ),
            (
                "onColorContainer".to_string(),
                JsonValue::String(fmt(&c.on_color_container)?),
            ),
        ];

        let resolved = resolve_custom_state_layers_for_export(c, state_layers)?;
        for (state, hex) in resolved.color_states {
            entry.push((
                format!("color{}", state.pascal_str()),
                JsonValue::String(fmt(&hex)?),
            ));
        }
        for (state, hex) in resolved.on_color_states {
            entry.push((
                format!("onColor{}", state.pascal_str()),
                JsonValue::String(fmt(&hex)?),
            ));
        }
        for (state, hex) in resolved.container_states {
            entry.push((
                format!("colorContainer{}", state.pascal_str()),
                JsonValue::String(fmt(&hex)?),
            ));
        }
        for (state, hex) in resolved.on_container_states {
            entry.push((
                format!("onColorContainer{}", state.pascal_str()),
                JsonValue::String(fmt(&hex)?),
            ));
        }

        entries.push((c.name.clone(), JsonValue::Object(entry)));
    }

    Ok(JsonValue::Object(entries))
}

pub fn export_typescript_tokens(
    light_scheme: &DynamicSchemeColors,
    dark_scheme: &DynamicSchemeColors,
    options: &ExportTokensBaseOptions,
) -> Result<String, OkyctError> {
    let color_format = options.color_format;
    let state_layers = options.state_layers.as_ref();

    let mut light_entries = extract_tokens(light_scheme, color_format, state_layers)?;
    light_entries.push((
        "custom".to_string(),
        build_custom_map(&options.custom_colors_light, color_format, state_layers)?,
    ));
    let light_json = serialize_canonical_json(&JsonValue::Object(light_entries));

    let mut dark_entries = extract_tokens(dark_scheme, color_format, state_layers)?;
    dark_entries.push((
        "custom".to_string(),
        build_custom_map(&options.custom_colors_dark, color_format, state_layers)?,
    ));
    let dark_json = serialize_canonical_json(&JsonValue::Object(dark_entries));

    Ok(format!(
        "/**\n * OKYCT Typed Color Tokens\n */\n\nexport const LightThemeTokens = {light_json} as const\n\nexport const DarkThemeTokens = {dark_json} as const\n\nexport type ThemeColors = typeof LightThemeTokens\n"
    ))
}
