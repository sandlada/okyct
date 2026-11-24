/// Result record for a single colorimetric invariant test in the self-check suite.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvariantTestResult {
    pub id: String,
    pub name: String,
    pub formula: String,
    pub passed: bool,
    pub measured_value: String,
    pub threshold: String,
    pub samples_checked: usize,
    pub details: String,
}
