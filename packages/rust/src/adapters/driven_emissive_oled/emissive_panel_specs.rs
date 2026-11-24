use crate::ports::inbound::EmissivePanelType;
use crate::ports::outbound::{
    DEFAULT_EMISSIVE_PANEL_SPECS, EmissivePanelSpec, default_panel_spec,
};

pub const EMISSIVE_PANEL_SPECS: [EmissivePanelSpec; 5] = DEFAULT_EMISSIVE_PANEL_SPECS;

pub const fn get_emissive_panel_spec(profile: EmissivePanelType) -> EmissivePanelSpec {
    default_panel_spec(profile)
}
