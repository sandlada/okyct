/// Gamut cusp (maximum chroma and corresponding tone) for a given hue.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GamutCusp {
    pub tone: f64,
    pub chroma: f64,
}
