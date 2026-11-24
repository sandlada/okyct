/// Contrast metric selection for foreground tone solving.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum ContrastMetric {
    #[default]
    Wcag,
    Apca,
    Both,
}

impl ContrastMetric {
    pub const ALL: [Self; 3] = [Self::Wcag, Self::Apca, Self::Both];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Wcag => "wcag",
            Self::Apca => "apca",
            Self::Both => "both",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "wcag" => Some(Self::Wcag),
            "apca" => Some(Self::Apca),
            "both" => Some(Self::Both),
            _ => None,
        }
    }
}

/// Options for `solve_tones_for_contrast`.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct ContrastSolveOptions {
    pub metric: ContrastMetric,
    pub target_lc: Option<f64>,
}
