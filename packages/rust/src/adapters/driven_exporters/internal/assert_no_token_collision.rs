use std::collections::HashMap;
use crate::domain::models::OkyctError;

pub fn register_token_key(
    registry: &mut HashMap<String, String>,
    key: &str,
    source_label: &str,
    context: &str,
) -> Result<(), OkyctError> {
    if let Some(existing) = registry.get(key) {
        return Err(OkyctError::new(format!(
            "Token key collision in {context}: \"{key}\" from {source_label} conflicts with {existing}."
        )));
    }
    registry.insert(key.to_string(), source_label.to_string());
    Ok(())
}
