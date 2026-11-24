use crate::domain::models::{Okyct, OkyctError};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum ImageQuantizerMode {
    #[default]
    HueToneGrid,
    HueHistogram,
}

impl ImageQuantizerMode {
    pub const ALL: [Self; 2] = [Self::HueToneGrid, Self::HueHistogram];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::HueToneGrid => "hue-tone-grid",
            Self::HueHistogram => "hue-histogram",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "hue-tone-grid" => Some(Self::HueToneGrid),
            "hue-histogram" => Some(Self::HueHistogram),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ExtractSeedsOptions {
    pub max_colors: usize,
    pub mode: ImageQuantizerMode,
    pub min_hue_distance: f64,
    pub min_tone_distance: f64,
}

impl Default for ExtractSeedsOptions {
    fn default() -> Self {
        Self {
            max_colors: 4,
            mode: ImageQuantizerMode::HueToneGrid,
            min_hue_distance: 28.0,
            min_tone_distance: 22.0,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ExtractedSeedColor {
    pub hex: String,
    pub okyct: Okyct,
    pub population_ratio: f64,
    pub salience_score: f64,
    pub is_fallback: Option<bool>,
}

#[derive(Debug, Clone, Copy)]
pub struct ImagePixelBuffer<'a> {
    pub data: &'a [u8],
    pub width: Option<usize>,
    pub height: Option<usize>,
}

pub trait ImageQuantizerPort {
    fn extract_seeds_from_image_data(
        &self,
        image_data: ImagePixelBuffer<'_>,
        options: ExtractSeedsOptions,
    ) -> Result<Vec<ExtractedSeedColor>, OkyctError>;
}
