/// Result of O(1) algebraic / APCA contrast tone inversion.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ContrastSolution {
    pub dark_foreground_tone: Option<f64>,
    pub light_foreground_tone: Option<f64>,
}
