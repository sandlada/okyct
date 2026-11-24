use std::collections::HashMap;

use crate::domain::models::OkyctError;
use crate::ports::inbound::{DynamicSchemeColors, ResolvedCustomColor, SystemColorToken};
use crate::ports::outbound::ExportTokensBaseOptions;
use super::internal::assert_no_token_collision::register_token_key;
use super::internal::format_export_color::{format_color_value, format_scheme_token};
use super::internal::resolve_export_state_layers::{
    resolve_custom_state_layers_for_export, resolve_system_state_layers_for_export,
};
use super::internal::serialize_canonical_json::{JsonValue, serialize_canonical_json};

fn leaf(val: String, desc: String) -> JsonValue {
    JsonValue::Object(vec![
        ("$value".to_string(), JsonValue::String(val)),
        ("$type".to_string(), JsonValue::String("color".to_string())),
        ("$description".to_string(), JsonValue::String(desc)),
    ])
}

pub fn export_w3c_design_tokens(
    light_scheme: &DynamicSchemeColors,
    dark_scheme: &DynamicSchemeColors,
    options: &ExportTokensBaseOptions,
) -> Result<String, OkyctError> {
    let color_format = options.color_format;
    let state_layers = options.state_layers.as_ref();

    let build_group = |scheme: &DynamicSchemeColors,
                       customs: &[ResolvedCustomColor]|
     -> Result<JsonValue, OkyctError> {
        let mut entries = Vec::new();
        let mut group_keys = HashMap::new();

        for k in SystemColorToken::ALL {
            let name = k.as_str();
            register_token_key(
                &mut group_keys,
                name,
                &format!("system role \"{name}\""),
                "exportW3cDesignTokens",
            )?;
            entries.push((
                name.to_string(),
                leaf(
                    format_scheme_token(scheme, k, color_format)?,
                    format!("Material Design 3 system token for {name}"),
                ),
            ));
        }

        for (state_key, state_hex) in resolve_system_state_layers_for_export(scheme, state_layers)? {
            register_token_key(
                &mut group_keys,
                &state_key,
                &format!("system state layer \"{state_key}\""),
                "exportW3cDesignTokens",
            )?;
            entries.push((
                state_key.clone(),
                leaf(
                    format_color_value(&state_hex, color_format, None)?,
                    format!("Pre-composited state layer token for {state_key}"),
                ),
            ));
        }

        for c in customs {
            register_token_key(
                &mut group_keys,
                &c.name,
                &format!("custom color \"{}\"", c.name),
                "exportW3cDesignTokens",
            )?;
            let resolved = resolve_custom_state_layers_for_export(c, state_layers)?;
            let fmt = |hex: &str| format_color_value(hex, color_format, None);

            let mut custom_entries = vec![
                ("color".to_string(), leaf(fmt(&c.color)?, format!("{} base role", c.label))),
                (
                    "onColor".to_string(),
                    leaf(fmt(&c.on_color)?, format!("{} foreground text", c.label)),
                ),
                (
                    "colorContainer".to_string(),
                    leaf(fmt(&c.color_container)?, format!("{} tonal container", c.label)),
                ),
                (
                    "onColorContainer".to_string(),
                    leaf(
                        fmt(&c.on_color_container)?,
                        format!("{} container text", c.label),
                    ),
                ),
            ];

            for (state, hex) in resolved.color_states {
                custom_entries.push((
                    format!("color{}", state.pascal_str()),
                    leaf(fmt(&hex)?, format!("{} {} state layer", c.label, state.as_str())),
                ));
            }
            for (state, hex) in resolved.on_color_states {
                custom_entries.push((
                    format!("onColor{}", state.pascal_str()),
                    leaf(
                        fmt(&hex)?,
                        format!("{} on-color {} state layer", c.label, state.as_str()),
                    ),
                ));
            }
            for (state, hex) in resolved.container_states {
                custom_entries.push((
                    format!("colorContainer{}", state.pascal_str()),
                    leaf(
                        fmt(&hex)?,
                        format!("{} container {} state layer", c.label, state.as_str()),
                    ),
                ));
            }
            for (state, hex) in resolved.on_container_states {
                custom_entries.push((
                    format!("onColorContainer{}", state.pascal_str()),
                    leaf(
                        fmt(&hex)?,
                        format!("{} container on-color {} state layer", c.label, state.as_str()),
                    ),
                ));
            }

            entries.push((c.name.clone(), JsonValue::Object(custom_entries)));
        }

        Ok(JsonValue::Object(entries))
    };

    let root = JsonValue::Object(vec![(
        "color".to_string(),
        JsonValue::Object(vec![
            (
                "light".to_string(),
                build_group(light_scheme, &options.custom_colors_light)?,
            ),
            (
                "dark".to_string(),
                build_group(dark_scheme, &options.custom_colors_dark)?,
            ),
        ]),
    )]);

    Ok(serialize_canonical_json(&root))
}
