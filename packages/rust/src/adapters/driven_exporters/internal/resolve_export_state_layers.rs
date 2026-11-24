use std::collections::HashSet;
use crate::application::{
    ResolveSchemeStateLayersOptions, resolve_scheme_state_layers_ordered, stack_state_layers,
};
use crate::domain::models::OkyctError;
use crate::ports::inbound::{
    DynamicSchemeColors, ResolvedCustomColor, StackStateInput, StateLayerState, StateLayersOption,
    SystemColorToken,
};

fn normalize_states(option: &StateLayersOption) -> Vec<StateLayerState> {
    match option {
        StateLayersOption::Disabled => Vec::new(),
        StateLayersOption::All => StateLayerState::ALL.to_vec(),
        StateLayersOption::Selected(states) => {
            let mut result = Vec::with_capacity(states.len());
            for &s in states {
                if !result.contains(&s) {
                    result.push(s);
                }
            }
            result.sort();
            result
        }
    }
}

fn to_stack_state(state: StateLayerState) -> StackStateInput {
    match state {
        StateLayerState::Hovered => StackStateInput::Hovered,
        StateLayerState::Focused => StackStateInput::Focused,
        StateLayerState::Pressed => StackStateInput::Pressed,
        StateLayerState::Dragged => StackStateInput::Dragged,
    }
}

pub fn resolve_system_state_layers_for_export(
    scheme: &DynamicSchemeColors,
    state_layers: Option<&StateLayersOption>,
) -> Result<Vec<(String, String)>, OkyctError> {
    match state_layers {
        Some(StateLayersOption::Disabled) => Ok(Vec::new()),
        Some(opt) => {
            let requested = normalize_states(opt);
            if requested.is_empty() {
                return Ok(Vec::new());
            }
            let entries = resolve_scheme_state_layers_ordered(
                scheme,
                opt,
                ResolveSchemeStateLayersOptions::default(),
            )?;
            if let Some(existing) = &scheme.state_layers {
                Ok(entries
                    .into_iter()
                    .map(|(key, fallback)| {
                        let val = existing.get(&key).cloned().unwrap_or(fallback);
                        (key, val)
                    })
                    .collect())
            } else {
                Ok(entries)
            }
        }
        None => {
            if let Some(existing) = &scheme.state_layers {
                let mut entries = Vec::with_capacity(existing.len());
                let mut seen = HashSet::new();
                for token in SystemColorToken::STATEFUL {
                    for state in StateLayerState::ALL {
                        let key = format!("{}{}", token.as_str(), state.pascal_str());
                        if let Some(val) = existing.get(&key) {
                            seen.insert(key.clone());
                            entries.push((key, val.clone()));
                        }
                    }
                }
                for (k, v) in existing {
                    if !seen.contains(k) {
                        entries.push((k.clone(), v.clone()));
                    }
                }
                Ok(entries)
            } else {
                Ok(Vec::new())
            }
        }
    }
}

pub struct ResolvedCustomStateLayers {
    pub color_states: Vec<(StateLayerState, String)>,
    pub on_color_states: Vec<(StateLayerState, String)>,
    pub container_states: Vec<(StateLayerState, String)>,
    pub on_container_states: Vec<(StateLayerState, String)>,
}

pub fn resolve_custom_state_layers_for_export(
    custom: &ResolvedCustomColor,
    state_layers: Option<&StateLayersOption>,
) -> Result<ResolvedCustomStateLayers, OkyctError> {
    let empty = || ResolvedCustomStateLayers {
        color_states: Vec::new(),
        on_color_states: Vec::new(),
        container_states: Vec::new(),
        on_container_states: Vec::new(),
    };

    match state_layers {
        Some(StateLayersOption::Disabled) => Ok(empty()),
        Some(opt) => {
            let states = normalize_states(opt);
            if states.is_empty() {
                return Ok(empty());
            }
            let existing = custom.state_layers.as_ref();
            let mut color_states = Vec::with_capacity(states.len());
            let mut on_color_states = Vec::with_capacity(states.len());
            let mut container_states = Vec::with_capacity(states.len());
            let mut on_container_states = Vec::with_capacity(states.len());

            for state in states {
                let cap = state.pascal_str();
                let stack_state = [to_stack_state(state)];

                let c_hex = match existing.and_then(|m| m.get(&format!("color{cap}"))) {
                    Some(h) => h.clone(),
                    None => stack_state_layers(&stack_state, &custom.color, &custom.on_color)?.final_hex,
                };
                color_states.push((state, c_hex));

                let oc_hex = match existing.and_then(|m| m.get(&format!("onColor{cap}"))) {
                    Some(h) => h.clone(),
                    None => stack_state_layers(&stack_state, &custom.on_color, &custom.color)?.final_hex,
                };
                on_color_states.push((state, oc_hex));

                let cc_hex = match existing.and_then(|m| m.get(&format!("colorContainer{cap}"))) {
                    Some(h) => h.clone(),
                    None => {
                        stack_state_layers(
                            &stack_state,
                            &custom.color_container,
                            &custom.on_color_container,
                        )?
                        .final_hex
                    }
                };
                container_states.push((state, cc_hex));

                let occ_hex = match existing.and_then(|m| m.get(&format!("onColorContainer{cap}"))) {
                    Some(h) => h.clone(),
                    None => {
                        stack_state_layers(
                            &stack_state,
                            &custom.on_color_container,
                            &custom.color_container,
                        )?
                        .final_hex
                    }
                };
                on_container_states.push((state, occ_hex));
            }

            Ok(ResolvedCustomStateLayers {
                color_states,
                on_color_states,
                container_states,
                on_container_states,
            })
        }
        None => {
            let Some(existing) = custom.state_layers.as_ref() else {
                return Ok(empty());
            };
            let mut color_states = Vec::new();
            let mut on_color_states = Vec::new();
            let mut container_states = Vec::new();
            let mut on_container_states = Vec::new();

            for state in StateLayerState::ALL {
                let cap = state.pascal_str();
                if let Some(h) = existing.get(&format!("color{cap}")) {
                    color_states.push((state, h.clone()));
                }
                if let Some(h) = existing.get(&format!("onColor{cap}")) {
                    on_color_states.push((state, h.clone()));
                }
                if let Some(h) = existing.get(&format!("colorContainer{cap}")) {
                    container_states.push((state, h.clone()));
                }
                if let Some(h) = existing.get(&format!("onColorContainer{cap}")) {
                    on_container_states.push((state, h.clone()));
                }
            }

            Ok(ResolvedCustomStateLayers {
                color_states,
                on_color_states,
                container_states,
                on_container_states,
            })
        }
    }
}
