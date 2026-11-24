use super::rgb::Rgb;

/// Result of checking whether a color falls inside the target RGB gamut.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GamutCheckResult {
    pub in_gamut: bool,
    pub rgb: Rgb,
}
