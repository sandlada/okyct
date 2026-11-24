/// Supported CSS Color 4 serialization formats for OKYCT palette and scheme outputs.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum CssColorFormat {
    #[default]
    Hex,
    Oklch,
    DisplayP3,
}

impl CssColorFormat {
    pub const ALL: [Self; 3] = [Self::Hex, Self::Oklch, Self::DisplayP3];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Hex => "hex",
            Self::Oklch => "oklch",
            Self::DisplayP3 => "display-p3",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "hex" => Some(Self::Hex),
            "oklch" => Some(Self::Oklch),
            "display-p3" => Some(Self::DisplayP3),
            _ => None,
        }
    }
}
