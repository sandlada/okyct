/// Color Vision Deficiency (CVD) simulation types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum CvdType {
    #[default]
    None,
    Protanopia,
    Deuteranopia,
    Tritanopia,
    Achromatopsia,
}

impl CvdType {
    pub const ALL: [Self; 5] = [
        Self::None,
        Self::Protanopia,
        Self::Deuteranopia,
        Self::Tritanopia,
        Self::Achromatopsia,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Protanopia => "protanopia",
            Self::Deuteranopia => "deuteranopia",
            Self::Tritanopia => "tritanopia",
            Self::Achromatopsia => "achromatopsia",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "none" => Some(Self::None),
            "protanopia" => Some(Self::Protanopia),
            "deuteranopia" => Some(Self::Deuteranopia),
            "tritanopia" => Some(Self::Tritanopia),
            "achromatopsia" => Some(Self::Achromatopsia),
            _ => None,
        }
    }
}
