use std::fmt;

/// Domain and engine error type for OKYCT operations.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OkyctError {
    message: String,
}

impl OkyctError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }

    pub fn message(&self) -> &str {
        &self.message
    }
}

impl fmt::Display for OkyctError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for OkyctError {}
