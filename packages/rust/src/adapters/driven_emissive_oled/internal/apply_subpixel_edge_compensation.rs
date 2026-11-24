use crate::domain::models::{ColorConversionOptions, Okyct, OkyctError};
use crate::domain::services::{hex_to_okyct, okyct_to_hex};
use crate::ports::inbound::EmissivePanelType;
use crate::ports::outbound::EmissiveRoleKind;

pub fn apply_subpixel_edge_compensation(
    hex: &str,
    profile: EmissivePanelType,
    role_kind: EmissiveRoleKind,
) -> Result<String, OkyctError> {
    let okyct = hex_to_okyct(hex)?;

    match profile {
        EmissivePanelType::AmoledAntiSmear => {
            if role_kind == EmissiveRoleKind::Foreground || role_kind == EmissiveRoleKind::Accent {
                let damped_c = if okyct.c > 0.14 {
                    0.14 + (okyct.c - 0.14) * 0.78
                } else {
                    okyct.c
                };
                let clamped_t = if role_kind == EmissiveRoleKind::Foreground && okyct.t > 97.0 {
                    97.0
                } else {
                    okyct.t
                };
                return okyct_to_hex(
                    Okyct::new(okyct.h, damped_c, clamped_t),
                    ColorConversionOptions::default(),
                );
            }
        }
        EmissivePanelType::MicroOledXr => {
            if role_kind == EmissiveRoleKind::Foreground && okyct.t > 92.0 {
                return okyct_to_hex(
                    Okyct::new(okyct.h, okyct.c * 0.9, 92.0),
                    ColorConversionOptions::default(),
                );
            }
            if role_kind == EmissiveRoleKind::Accent && okyct.c > 0.15 {
                return okyct_to_hex(
                    Okyct::new(okyct.h, okyct.c * 0.85, okyct.t.min(90.0)),
                    ColorConversionOptions::default(),
                );
            }
        }
        _ => {}
    }

    Ok(hex.to_string())
}
