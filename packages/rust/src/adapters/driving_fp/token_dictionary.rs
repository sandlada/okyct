use std::collections::{HashMap, HashSet};
use crate::domain::models::OkyctError;
use crate::domain::services::trim_ascii_whitespace;
use crate::ports::inbound::{
    DynamicSchemeColors, ResolvedCustomColor, StateLayerState, SystemColorToken,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum NamingCase {
    Kebab,
    Camel,
    Snake,
    Constant,
}

impl NamingCase {
    pub const ALL: [Self; 4] = [Self::Kebab, Self::Camel, Self::Snake, Self::Constant];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Kebab => "kebab",
            Self::Camel => "camel",
            Self::Snake => "snake",
            Self::Constant => "constant",
        }
    }
}

/// Insertion-ordered string-to-string token dictionary.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TokenDictionary {
    entries: Vec<(String, String)>,
}

impl TokenDictionary {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn from_entries(entries: Vec<(String, String)>) -> Self {
        let mut dict = Self::new();
        for (k, v) in entries {
            dict.insert(k, v);
        }
        dict
    }

    pub fn insert(&mut self, key: String, value: String) {
        if let Some(existing) = self.entries.iter_mut().find(|(k, _)| k == &key) {
            existing.1 = value;
        } else {
            self.entries.push((key, value));
        }
    }

    pub fn get(&self, key: &str) -> Option<&str> {
        self.entries
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.as_str())
    }

    pub fn contains_key(&self, key: &str) -> bool {
        self.entries.iter().any(|(k, _)| k == key)
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    pub fn iter(&self) -> impl Iterator<Item = (&str, &str)> {
        self.entries.iter().map(|(k, v)| (k.as_str(), v.as_str()))
    }

    pub fn keys(&self) -> impl Iterator<Item = &str> {
        self.entries.iter().map(|(k, _)| k.as_str())
    }

    pub fn into_entries(self) -> Vec<(String, String)> {
        self.entries
    }
}

pub(crate) fn split_token_words(name: &str) -> Vec<String> {
    let trimmed = trim_ascii_whitespace(name);
    let stripped = trimmed.trim_start_matches('-');
    let mut spaced = String::with_capacity(stripped.len() + 8);
    let chars: Vec<char> = stripped.chars().collect();
    for i in 0..chars.len() {
        let ch = chars[i];
        if i > 0 {
            let prev = chars[i - 1];
            let next = chars.get(i + 1).copied();
            if ((prev.is_ascii_lowercase() || prev.is_ascii_digit()) && ch.is_ascii_uppercase())
                || (prev.is_ascii_uppercase()
                    && ch.is_ascii_uppercase()
                    && matches!(next, Some(n) if n.is_ascii_lowercase()))
            {
                spaced.push(' ');
            }
        }
        spaced.push(ch);
    }
    trim_ascii_whitespace(&spaced)
        .split(['-', '_', ' ', '\t', '\n', '\r', '\x0C'])
        .filter(|s| !s.is_empty())
        .map(ToString::to_string)
        .collect()
}

fn to_camel_name(name: &str) -> Result<String, OkyctError> {
    let words = split_token_words(name);
    if words.is_empty() {
        return Err(OkyctError::new(format!(
            "Invalid custom color name: \"{name}\". Expected at least one alphanumeric word."
        )));
    }
    let mut out = String::new();
    for (i, w) in words.iter().enumerate() {
        if i == 0 {
            out.push_str(&w.to_ascii_lowercase());
        } else {
            let mut chars = w.chars();
            if let Some(first) = chars.next() {
                out.push(first.to_ascii_uppercase());
                out.push_str(&chars.as_str().to_ascii_lowercase());
            }
        }
    }
    Ok(out)
}

fn custom_role_keys(name: &str) -> Result<[String; 4], OkyctError> {
    let base = to_camel_name(name)?;
    let mut chars = base.chars();
    let cap = match chars.next() {
        Some(first) => format!("{}{}", first.to_ascii_uppercase(), chars.as_str()),
        None => String::new(),
    };
    Ok([
        base.clone(),
        format!("on{cap}"),
        format!("{base}Container"),
        format!("on{cap}Container"),
    ])
}

pub fn to_token_dictionary(
    scheme: &DynamicSchemeColors,
    custom_colors: &[ResolvedCustomColor],
    include_state_layers: bool,
) -> Result<TokenDictionary, OkyctError> {
    let mut dict = TokenDictionary::new();
    let mut key_sources: HashMap<String, String> = HashMap::new();

    let mut assign_token = |key: String, value: String, source_label: String| -> Result<(), OkyctError> {
        if let Some(existing) = key_sources.get(&key) {
            return Err(OkyctError::new(format!(
                "Token key collision in toTokenDictionary: \"{key}\" from {source_label} conflicts with {existing}."
            )));
        }
        key_sources.insert(key.clone(), source_label);
        dict.insert(key, value);
        Ok(())
    };

    for key in SystemColorToken::ALL {
        let k = key.as_str().to_string();
        let v = scheme.get(key).to_string();
        assign_token(k.clone(), v, format!("system role \"{k}\""))?;
    }

    if include_state_layers && let Some(sl) = &scheme.state_layers {
        let mut seen = HashSet::new();
        for token in SystemColorToken::STATEFUL {
            for state in StateLayerState::ALL {
                let key = format!("{}{}", token.as_str(), state.pascal_str());
                if let Some(val) = sl.get(&key) {
                    seen.insert(key.clone());
                    assign_token(
                        key.clone(),
                        val.clone(),
                        format!("system state layer \"{key}\""),
                    )?;
                }
            }
        }
        for (k, v) in sl {
            if !seen.contains(k) {
                assign_token(
                    k.clone(),
                    v.clone(),
                    format!("system state layer \"{k}\""),
                )?;
            }
        }
    }

    for custom in custom_colors {
        let source_label = format!("custom color \"{}\"", custom.name);
        let [base_key, on_key, container_key, on_container_key] = custom_role_keys(&custom.name)?;
        assign_token(base_key.clone(), custom.color.clone(), source_label.clone())?;
        assign_token(on_key.clone(), custom.on_color.clone(), source_label.clone())?;
        assign_token(
            container_key.clone(),
            custom.color_container.clone(),
            source_label.clone(),
        )?;
        assign_token(
            on_container_key.clone(),
            custom.on_color_container.clone(),
            source_label.clone(),
        )?;

        if include_state_layers && let Some(sl) = &custom.state_layers {
            let role_pairs = [
                ("color", base_key.as_str()),
                ("onColor", on_key.as_str()),
                ("colorContainer", container_key.as_str()),
                ("onColorContainer", on_container_key.as_str()),
            ];
            for state in StateLayerState::ALL {
                let cap = state.pascal_str();
                for (source_prefix, target_prefix) in role_pairs {
                    if let Some(state_hex) = sl.get(&format!("{source_prefix}{cap}")) {
                        assign_token(
                            format!("{target_prefix}{cap}"),
                            state_hex.clone(),
                            source_label.clone(),
                        )?;
                    }
                }
            }
        }
    }

    Ok(dict)
}
