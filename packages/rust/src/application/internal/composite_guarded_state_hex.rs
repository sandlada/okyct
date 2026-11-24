use crate::domain::models::{ColorToneInput, OkyctError};
use crate::domain::services::get_contrast_ratio;
use crate::ports::inbound::{
    BlendSpace, ColorLayer, StackOptions, StateLayerBlendSpace, StateLayerState,
};
use super::super::stacking::stack_layers;

const MIN_CONTRAST_GUARD_RATIO: f64 = 4.5;

fn state_opacity(state: StateLayerState) -> f64 {
    match state {
        StateLayerState::Hovered => 0.08,
        StateLayerState::Focused | StateLayerState::Pressed => 0.12,
        StateLayerState::Dragged => 0.16,
    }
}

fn to_blend_space(space: StateLayerBlendSpace) -> BlendSpace {
    match space {
        StateLayerBlendSpace::Okyct => BlendSpace::Okyct,
        StateLayerBlendSpace::GammaSrgb => BlendSpace::GammaSrgb,
        StateLayerBlendSpace::LinearSrgb => BlendSpace::LinearSrgb,
    }
}

fn composite_state_hex(
    base_hex: &str,
    overlay_hex: &str,
    state: StateLayerState,
    opacity: f64,
    blend_space: StateLayerBlendSpace,
) -> Result<String, OkyctError> {
    let pct = (opacity * 100.0 + 0.5).floor() as i64;
    let layers = [ColorLayer {
        color: overlay_hex.to_string(),
        opacity,
        label: Some(format!(
            "{} State Layer ({pct}%)",
            state.as_str().to_ascii_uppercase()
        )),
    }];
    let res = stack_layers(
        StackOptions {
            blend_space: to_blend_space(blend_space),
        },
        &layers,
        base_hex,
    )?;
    Ok(res.final_hex)
}

pub fn composite_guarded_state_hex(
    base_hex: &str,
    overlay_hex: &str,
    state: StateLayerState,
    blend_space: StateLayerBlendSpace,
    contrast_guard: bool,
) -> Result<String, OkyctError> {
    let nominal_opacity = state_opacity(state);
    let nominal_hex = composite_state_hex(base_hex, overlay_hex, state, nominal_opacity, blend_space)?;

    if !contrast_guard {
        return Ok(nominal_hex);
    }
    if get_contrast_ratio(ColorToneInput::Hex(base_hex), ColorToneInput::Hex(overlay_hex))?
        < MIN_CONTRAST_GUARD_RATIO
    {
        return Ok(nominal_hex);
    }
    if get_contrast_ratio(
        ColorToneInput::Hex(&nominal_hex),
        ColorToneInput::Hex(overlay_hex),
    )? >= MIN_CONTRAST_GUARD_RATIO
    {
        return Ok(nominal_hex);
    }

    let mut low = 0.0;
    let mut high = nominal_opacity;
    let mut best_hex = base_hex.to_string();
    for _ in 0..8 {
        let mid = (low + high) * 0.5;
        let cand_hex = composite_state_hex(base_hex, overlay_hex, state, mid, blend_space)?;
        if get_contrast_ratio(
            ColorToneInput::Hex(&cand_hex),
            ColorToneInput::Hex(overlay_hex),
        )? >= MIN_CONTRAST_GUARD_RATIO
        {
            best_hex = cand_hex;
            low = mid;
        } else {
            high = mid;
        }
    }
    Ok(best_hex)
}
