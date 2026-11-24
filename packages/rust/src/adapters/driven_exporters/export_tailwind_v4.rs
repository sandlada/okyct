use std::collections::HashMap;

use crate::domain::models::OkyctError;
use crate::ports::inbound::{
    DynamicSchemeColors, ResolvedCustomColor, StateLayerState, SystemColorToken,
};
use crate::ports::outbound::{ExportTailwindV4Options, TailwindFallbackMode};
use super::internal::assert_no_token_collision::register_token_key;
use super::internal::format_export_color::{format_color_value, format_scheme_token};
use super::internal::kebab_case::kebab_case;
use super::internal::resolve_export_state_layers::{
    resolve_custom_state_layers_for_export, resolve_system_state_layers_for_export,
};

fn color_var(token: &str, light: &str, dark: &str, fallback: TailwindFallbackMode) -> String {
    match fallback {
        TailwindFallbackMode::LightDark => format!("var({token}, light-dark({light}, {dark}))"),
        TailwindFallbackMode::None => format!("var({token})"),
    }
}

pub fn export_tailwind_v4(
    light_scheme: &DynamicSchemeColors,
    dark_scheme: &DynamicSchemeColors,
    options: &ExportTailwindV4Options,
) -> Result<String, OkyctError> {
    let color_format = options.base.color_format;
    let state_layers = options.base.state_layers.as_ref();
    let custom_light = &options.base.custom_colors_light;
    let custom_dark = &options.base.custom_colors_dark;
    let fallback = options.fallback;

    let dark_by_name: HashMap<&str, &ResolvedCustomColor> =
        custom_dark.iter().map(|c| (c.name.as_str(), c)).collect();
    let mut tailwind_keys = HashMap::new();
    let mut system_lines = Vec::new();

    for key in SystemColorToken::ALL {
        let k = kebab_case(key.as_str());
        let css_var = format!("--color-{k}");
        register_token_key(
            &mut tailwind_keys,
            &css_var,
            &format!("system role \"{}\"", key.as_str()),
            "exportTailwindV4",
        )?;
        let light_val = format_scheme_token(light_scheme, key, color_format)?;
        let dark_val = format_scheme_token(dark_scheme, key, color_format)?;
        system_lines.push(format!(
            "  {css_var}: {};",
            color_var(&format!("--md-sys-color-{k}"), &light_val, &dark_val, fallback)
        ));
    }

    let light_states = resolve_system_state_layers_for_export(light_scheme, state_layers)?;
    let dark_states_map: HashMap<String, String> =
        resolve_system_state_layers_for_export(dark_scheme, state_layers)?
            .into_iter()
            .collect();
    for (key, light_val) in light_states {
        let dark_val = dark_states_map.get(&key).map(String::as_str).unwrap_or(&light_val);
        let k = kebab_case(&key);
        let css_var = format!("--color-{k}");
        register_token_key(
            &mut tailwind_keys,
            &css_var,
            &format!("system state layer \"{key}\""),
            "exportTailwindV4",
        )?;
        system_lines.push(format!(
            "  {css_var}: {};",
            color_var(
                &format!("--md-sys-color-{k}"),
                &format_color_value(&light_val, color_format, None)?,
                &format_color_value(dark_val, color_format, None)?,
                fallback
            )
        ));
    }

    let mut custom_lines = Vec::new();
    for color in custom_light {
        let dark = dark_by_name.get(color.name.as_str()).copied().unwrap_or(color);
        let k = kebab_case(&color.name);
        if k.is_empty() {
            return Err(OkyctError::new(format!(
                "Invalid custom color name: \"{}\". Expected at least one alphanumeric word.",
                color.name
            )));
        }
        let source_label = format!("custom color \"{}\"", color.name);

        let light_custom = resolve_custom_state_layers_for_export(color, state_layers)?;
        let dark_custom = resolve_custom_state_layers_for_export(dark, state_layers)?;
        let dark_color_map: HashMap<StateLayerState, String> =
            dark_custom.color_states.into_iter().collect();
        let dark_on_color_map: HashMap<StateLayerState, String> =
            dark_custom.on_color_states.into_iter().collect();
        let dark_container_map: HashMap<StateLayerState, String> =
            dark_custom.container_states.into_iter().collect();
        let dark_on_container_map: HashMap<StateLayerState, String> =
            dark_custom.on_container_states.into_iter().collect();

        let fmt = |hex: &str| format_color_value(hex, color_format, None);

        let base_var = format!("--color-{k}");
        register_token_key(&mut tailwind_keys, &base_var, &source_label, "exportTailwindV4")?;
        custom_lines.push(format!(
            "  {base_var}: {};",
            color_var(
                &format!("--md-custom-color-{k}"),
                &fmt(&color.color)?,
                &fmt(&dark.color)?,
                fallback
            )
        ));
        for (state, light_hex) in light_custom.color_states {
            let dark_hex = dark_color_map.get(&state).map(String::as_str).unwrap_or(&light_hex);
            let s_str = state.as_str();
            let v = format!("--color-{k}-{s_str}");
            register_token_key(&mut tailwind_keys, &v, &source_label, "exportTailwindV4")?;
            custom_lines.push(format!(
                "  {v}: {};",
                color_var(
                    &format!("--md-custom-color-{k}-{s_str}"),
                    &fmt(&light_hex)?,
                    &fmt(dark_hex)?,
                    fallback
                )
            ));
        }

        let on_var = format!("--color-on-{k}");
        register_token_key(&mut tailwind_keys, &on_var, &source_label, "exportTailwindV4")?;
        custom_lines.push(format!(
            "  {on_var}: {};",
            color_var(
                &format!("--md-custom-color-on-{k}"),
                &fmt(&color.on_color)?,
                &fmt(&dark.on_color)?,
                fallback
            )
        ));
        for (state, light_hex) in light_custom.on_color_states {
            let dark_hex = dark_on_color_map.get(&state).map(String::as_str).unwrap_or(&light_hex);
            let s_str = state.as_str();
            let v = format!("--color-on-{k}-{s_str}");
            register_token_key(&mut tailwind_keys, &v, &source_label, "exportTailwindV4")?;
            custom_lines.push(format!(
                "  {v}: {};",
                color_var(
                    &format!("--md-custom-color-on-{k}-{s_str}"),
                    &fmt(&light_hex)?,
                    &fmt(dark_hex)?,
                    fallback
                )
            ));
        }

        let cont_var = format!("--color-{k}-container");
        register_token_key(&mut tailwind_keys, &cont_var, &source_label, "exportTailwindV4")?;
        custom_lines.push(format!(
            "  {cont_var}: {};",
            color_var(
                &format!("--md-custom-color-{k}-container"),
                &fmt(&color.color_container)?,
                &fmt(&dark.color_container)?,
                fallback
            )
        ));
        for (state, light_hex) in light_custom.container_states {
            let dark_hex = dark_container_map.get(&state).map(String::as_str).unwrap_or(&light_hex);
            let s_str = state.as_str();
            let v = format!("--color-{k}-container-{s_str}");
            register_token_key(&mut tailwind_keys, &v, &source_label, "exportTailwindV4")?;
            custom_lines.push(format!(
                "  {v}: {};",
                color_var(
                    &format!("--md-custom-color-{k}-container-{s_str}"),
                    &fmt(&light_hex)?,
                    &fmt(dark_hex)?,
                    fallback
                )
            ));
        }

        let on_cont_var = format!("--color-on-{k}-container");
        register_token_key(&mut tailwind_keys, &on_cont_var, &source_label, "exportTailwindV4")?;
        custom_lines.push(format!(
            "  {on_cont_var}: {};",
            color_var(
                &format!("--md-custom-color-on-{k}-container"),
                &fmt(&color.on_color_container)?,
                &fmt(&dark.on_color_container)?,
                fallback
            )
        ));
        for (state, light_hex) in light_custom.on_container_states {
            let dark_hex = dark_on_container_map.get(&state).map(String::as_str).unwrap_or(&light_hex);
            let s_str = state.as_str();
            let v = format!("--color-on-{k}-container-{s_str}");
            register_token_key(&mut tailwind_keys, &v, &source_label, "exportTailwindV4")?;
            custom_lines.push(format!(
                "  {v}: {};",
                color_var(
                    &format!("--md-custom-color-on-{k}-container-{s_str}"),
                    &fmt(&light_hex)?,
                    &fmt(dark_hex)?,
                    fallback
                )
            ));
        }
    }

    let custom_block = if custom_lines.is_empty() {
        String::new()
    } else {
        format!("\n\n  /* Custom Extended Semantic Tokens */\n{}", custom_lines.join("\n"))
    };

    Ok(format!(
        "/* Tailwind CSS v4 Theme Extension */\n@import \"tailwindcss\";\n@custom-variant dark (&:where(.dark, .dark *));\n\n@theme {{\n{}{custom_block}\n}}\n",
        system_lines.join("\n")
    ))
}
