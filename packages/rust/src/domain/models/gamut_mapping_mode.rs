/// Gamut mapping strategy when chroma exceeds the target RGB gamut boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum GamutMappingMode {
    #[default]
    PreserveTone,
    CuspCompress,
}

impl GamutMappingMode {
    pub const ALL: [Self; 2] = [Self::PreserveTone, Self::CuspCompress];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::PreserveTone => "preserve-tone",
            Self::CuspCompress => "cusp-compress",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "preserve-tone" => Some(Self::PreserveTone),
            "cusp-compress" => Some(Self::CuspCompress),
            _ => None,
        }
    }
}
