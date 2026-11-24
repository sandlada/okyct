use super::gamut_mapping_mode::GamutMappingMode;
use super::gamut_target::GamutTarget;

/// Options controlling target gamut and gamut mapping mode during color conversions.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ColorConversionOptions {
    pub gamut: GamutTarget,
    pub gamut_mapping: GamutMappingMode,
}

impl ColorConversionOptions {
    pub const fn new(gamut: GamutTarget, gamut_mapping: GamutMappingMode) -> Self {
        Self {
            gamut,
            gamut_mapping,
        }
    }
}
