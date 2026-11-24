/// Target RGB gamut for color conversions and gamut mapping.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum GamutTarget {
    #[default]
    Srgb,
    DisplayP3,
}

impl GamutTarget {
    pub const ALL: [Self; 2] = [Self::Srgb, Self::DisplayP3];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Srgb => "srgb",
            Self::DisplayP3 => "display-p3",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "srgb" => Some(Self::Srgb),
            "display-p3" => Some(Self::DisplayP3),
            _ => None,
        }
    }
}
