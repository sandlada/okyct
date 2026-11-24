use std::collections::BTreeMap;

use crate::domain::models::OkyctError;
use crate::ports::inbound::{
    DynamicSchemeColors, StateLayerBlendSpace, StateLayersOption, SystemColorToken,
};
use super::internal::composite_guarded_state_hex::composite_guarded_state_hex;
use super::internal::scheme_token_role_map::{
    format_state_layer_key, normalize_state_layer_states, stateful_token_overlay,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ResolveSchemeStateLayersOptions {
    pub blend_space: StateLayerBlendSpace,
    pub contrast_guard: bool,
}

pub fn resolve_scheme_state_layers_ordered(
    scheme: &DynamicSchemeColors,
    state_layers: &StateLayersOption,
    options: ResolveSchemeStateLayersOptions,
) -> Result<Vec<(String, String)>, OkyctError> {
    let states = normalize_state_layer_states(state_layers);
    if states.is_empty() {
        return Ok(Vec::new());
    }

    let mut result = Vec::with_capacity(SystemColorToken::STATEFUL.len() * states.len());
    for base_token in SystemColorToken::STATEFUL {
        let base_hex = scheme.get(base_token);
        let Some(overlay_token) = stateful_token_overlay(base_token) else {
            continue;
        };
        let overlay_hex = scheme.get(overlay_token);

        for &state in &states {
            let key = format_state_layer_key(base_token.as_str(), state);
            let composited = composite_guarded_state_hex(
                base_hex,
                overlay_hex,
                state,
                options.blend_space,
                options.contrast_guard,
            )?;
            result.push((key, composited));
        }
    }

    Ok(result)
}

pub fn resolve_scheme_state_layers(
    scheme: &DynamicSchemeColors,
    state_layers: &StateLayersOption,
    options: ResolveSchemeStateLayersOptions,
) -> Result<BTreeMap<String, String>, OkyctError> {
    let entries = resolve_scheme_state_layers_ordered(scheme, state_layers, options)?;
    Ok(entries.into_iter().collect())
}
