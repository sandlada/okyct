use crate::ports::inbound::{
    StandardPaletteKey, StateLayerState, StateLayersOption, SystemColorToken,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SchemeRoleKind {
    Surface,
    Foreground,
    Accent,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchemeTokenRoleBinding {
    pub palette: StandardPaletteKey,
    pub kind: SchemeRoleKind,
}

pub const fn stateful_token_overlay(token: SystemColorToken) -> Option<SystemColorToken> {
    match token {
        SystemColorToken::Primary => Some(SystemColorToken::OnPrimary),
        SystemColorToken::OnPrimary => Some(SystemColorToken::Primary),
        SystemColorToken::PrimaryContainer => Some(SystemColorToken::OnPrimaryContainer),
        SystemColorToken::OnPrimaryContainer => Some(SystemColorToken::PrimaryContainer),
        SystemColorToken::PrimaryFixed => Some(SystemColorToken::OnPrimaryFixed),
        SystemColorToken::PrimaryFixedDim => Some(SystemColorToken::OnPrimaryFixed),
        SystemColorToken::OnPrimaryFixed => Some(SystemColorToken::PrimaryFixed),
        SystemColorToken::OnPrimaryFixedVariant => Some(SystemColorToken::PrimaryFixed),
        SystemColorToken::Secondary => Some(SystemColorToken::OnSecondary),
        SystemColorToken::OnSecondary => Some(SystemColorToken::Secondary),
        SystemColorToken::SecondaryContainer => Some(SystemColorToken::OnSecondaryContainer),
        SystemColorToken::OnSecondaryContainer => Some(SystemColorToken::SecondaryContainer),
        SystemColorToken::Tertiary => Some(SystemColorToken::OnTertiary),
        SystemColorToken::OnTertiary => Some(SystemColorToken::Tertiary),
        SystemColorToken::TertiaryContainer => Some(SystemColorToken::OnTertiaryContainer),
        SystemColorToken::OnTertiaryContainer => Some(SystemColorToken::TertiaryContainer),
        SystemColorToken::Error => Some(SystemColorToken::OnError),
        SystemColorToken::OnError => Some(SystemColorToken::Error),
        SystemColorToken::ErrorContainer => Some(SystemColorToken::OnErrorContainer),
        SystemColorToken::OnErrorContainer => Some(SystemColorToken::ErrorContainer),
        SystemColorToken::Warning => Some(SystemColorToken::OnWarning),
        SystemColorToken::OnWarning => Some(SystemColorToken::Warning),
        SystemColorToken::WarningContainer => Some(SystemColorToken::OnWarningContainer),
        SystemColorToken::OnWarningContainer => Some(SystemColorToken::WarningContainer),
        SystemColorToken::Success => Some(SystemColorToken::OnSuccess),
        SystemColorToken::OnSuccess => Some(SystemColorToken::Success),
        SystemColorToken::SuccessContainer => Some(SystemColorToken::OnSuccessContainer),
        SystemColorToken::OnSuccessContainer => Some(SystemColorToken::SuccessContainer),
        SystemColorToken::Info => Some(SystemColorToken::OnInfo),
        SystemColorToken::OnInfo => Some(SystemColorToken::Info),
        SystemColorToken::InfoContainer => Some(SystemColorToken::OnInfoContainer),
        SystemColorToken::OnInfoContainer => Some(SystemColorToken::InfoContainer),
        SystemColorToken::Surface => Some(SystemColorToken::OnSurface),
        SystemColorToken::OnSurface => Some(SystemColorToken::Surface),
        SystemColorToken::SurfaceVariant => Some(SystemColorToken::OnSurfaceVariant),
        SystemColorToken::OnSurfaceVariant => Some(SystemColorToken::SurfaceVariant),
        SystemColorToken::SurfaceDim => Some(SystemColorToken::OnSurface),
        SystemColorToken::SurfaceBright => Some(SystemColorToken::OnSurface),
        SystemColorToken::SurfaceContainerLowest => Some(SystemColorToken::OnSurface),
        SystemColorToken::SurfaceContainerLow => Some(SystemColorToken::OnSurface),
        SystemColorToken::SurfaceContainer => Some(SystemColorToken::OnSurface),
        SystemColorToken::SurfaceContainerHigh => Some(SystemColorToken::OnSurface),
        SystemColorToken::SurfaceContainerHighest => Some(SystemColorToken::OnSurface),
        SystemColorToken::InverseSurface => Some(SystemColorToken::InverseOnSurface),
        SystemColorToken::InverseOnSurface => Some(SystemColorToken::InverseSurface),
        SystemColorToken::InversePrimary => Some(SystemColorToken::InverseOnPrimary),
        SystemColorToken::InverseOnPrimary => Some(SystemColorToken::InversePrimary),
        SystemColorToken::InversePrimaryContainer => {
            Some(SystemColorToken::InverseOnPrimaryContainer)
        }
        SystemColorToken::InverseOnPrimaryContainer => {
            Some(SystemColorToken::InversePrimaryContainer)
        }
        SystemColorToken::Outline
        | SystemColorToken::OutlineVariant
        | SystemColorToken::Scrim
        | SystemColorToken::Shadow => None,
    }
}

pub const fn scheme_token_role(token: SystemColorToken) -> SchemeTokenRoleBinding {
    match token {
        SystemColorToken::Primary => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Primary,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnPrimary => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Primary,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::PrimaryContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Primary,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnPrimaryContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Primary,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::PrimaryFixed => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Primary,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::PrimaryFixedDim => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Primary,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnPrimaryFixed => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Primary,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::OnPrimaryFixedVariant => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Primary,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::Secondary => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Secondary,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnSecondary => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Secondary,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::SecondaryContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Secondary,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnSecondaryContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Secondary,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::Tertiary => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Tertiary,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnTertiary => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Tertiary,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::TertiaryContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Tertiary,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnTertiaryContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Tertiary,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::Error => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Error,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnError => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Error,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::ErrorContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Error,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnErrorContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Error,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::Warning => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Warning,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnWarning => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Warning,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::WarningContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Warning,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnWarningContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Warning,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::Success => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Success,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnSuccess => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Success,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::SuccessContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Success,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnSuccessContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Success,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::Info => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Info,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnInfo => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Info,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::InfoContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Info,
            kind: SchemeRoleKind::Accent,
        },
        SystemColorToken::OnInfoContainer => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Info,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::Surface => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Neutral,
            kind: SchemeRoleKind::Surface,
        },
        SystemColorToken::OnSurface => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Neutral,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::SurfaceVariant => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::NeutralVariant,
            kind: SchemeRoleKind::Surface,
        },
        SystemColorToken::OnSurfaceVariant => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::NeutralVariant,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::SurfaceDim
        | SystemColorToken::SurfaceBright
        | SystemColorToken::SurfaceContainerLowest
        | SystemColorToken::SurfaceContainerLow
        | SystemColorToken::SurfaceContainer
        | SystemColorToken::SurfaceContainerHigh
        | SystemColorToken::SurfaceContainerHighest
        | SystemColorToken::InverseSurface
        | SystemColorToken::Scrim
        | SystemColorToken::Shadow => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Neutral,
            kind: SchemeRoleKind::Surface,
        },
        SystemColorToken::Outline => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::NeutralVariant,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::OutlineVariant => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::NeutralVariant,
            kind: SchemeRoleKind::Surface,
        },
        SystemColorToken::InverseOnSurface => SchemeTokenRoleBinding {
            palette: StandardPaletteKey::Neutral,
            kind: SchemeRoleKind::Foreground,
        },
        SystemColorToken::InversePrimary | SystemColorToken::InversePrimaryContainer => {
            SchemeTokenRoleBinding {
                palette: StandardPaletteKey::Primary,
                kind: SchemeRoleKind::Accent,
            }
        }
        SystemColorToken::InverseOnPrimary | SystemColorToken::InverseOnPrimaryContainer => {
            SchemeTokenRoleBinding {
                palette: StandardPaletteKey::Primary,
                kind: SchemeRoleKind::Foreground,
            }
        }
    }
}

pub fn normalize_state_layer_states(option: &StateLayersOption) -> Vec<StateLayerState> {
    match option {
        StateLayersOption::Disabled => Vec::new(),
        StateLayersOption::All => StateLayerState::ALL.to_vec(),
        StateLayersOption::Selected(states) => {
            let mut result = Vec::with_capacity(states.len());
            for &state in states {
                if !result.contains(&state) {
                    result.push(state);
                }
            }
            result.sort();
            result
        }
    }
}

pub fn format_state_layer_key(token: &str, state: StateLayerState) -> String {
    format!("{token}{}", state.pascal_str())
}
