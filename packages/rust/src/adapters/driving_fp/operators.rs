use std::collections::{HashMap, HashSet};
use crate::domain::models::OkyctError;
use crate::domain::services::trim_ascii_whitespace;
use super::token_dictionary::{NamingCase, TokenDictionary, split_token_words};

fn transform_case(key: &str, target_case: NamingCase) -> String {
    let words = split_token_words(key);
    match target_case {
        NamingCase::Kebab => words
            .into_iter()
            .map(|w| w.to_ascii_lowercase())
            .collect::<Vec<_>>()
            .join("-"),
        NamingCase::Snake => words
            .into_iter()
            .map(|w| w.to_ascii_lowercase())
            .collect::<Vec<_>>()
            .join("_"),
        NamingCase::Constant => words
            .into_iter()
            .map(|w| w.to_ascii_uppercase())
            .collect::<Vec<_>>()
            .join("_"),
        NamingCase::Camel => {
            let mut out = String::new();
            for (i, w) in words.into_iter().enumerate() {
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
            out
        }
    }
}

pub fn rename_case(
    target_case: NamingCase,
    dict: &TokenDictionary,
) -> Result<TokenDictionary, OkyctError> {
    let mut result = TokenDictionary::new();
    let mut seen_sources: HashMap<String, String> = HashMap::new();
    for (key, val) in dict.iter() {
        let next_key = transform_case(key, target_case);
        if let Some(prev) = seen_sources.get(&next_key) {
            return Err(OkyctError::new(format!(
                "Token key collision in renameCase(\"{}\"): \"{prev}\" and \"{key}\" both map to \"{next_key}\".",
                target_case.as_str()
            )));
        }
        seen_sources.insert(next_key.clone(), key.to_string());
        result.insert(next_key, val.to_string());
    }
    Ok(result)
}

pub fn map_tokens<F>(dict: &TokenDictionary, mut mapper: F) -> TokenDictionary
where
    F: FnMut(&str, &str) -> String,
{
    let mut result = TokenDictionary::new();
    for (k, v) in dict.iter() {
        result.insert(k.to_string(), mapper(v, k));
    }
    result
}

pub fn with_prefix(prefix: &str, dict: &TokenDictionary) -> TokenDictionary {
    let p = if prefix.ends_with('-') || prefix.ends_with('_') || prefix.is_empty() {
        prefix.to_string()
    } else {
        format!("{prefix}-")
    };
    let mut result = TokenDictionary::new();
    for (k, v) in dict.iter() {
        result.insert(format!("{p}{k}"), v.to_string());
    }
    result
}

pub fn pick_tokens(keys: &[&str], dict: &TokenDictionary) -> TokenDictionary {
    let set: HashSet<&str> = keys.iter().copied().collect();
    let mut result = TokenDictionary::new();
    for (k, v) in dict.iter() {
        if set.contains(k) {
            result.insert(k.to_string(), v.to_string());
        }
    }
    result
}

pub fn omit_tokens(keys: &[&str], dict: &TokenDictionary) -> TokenDictionary {
    let set: HashSet<&str> = keys.iter().copied().collect();
    let mut result = TokenDictionary::new();
    for (k, v) in dict.iter() {
        if !set.contains(k) {
            result.insert(k.to_string(), v.to_string());
        }
    }
    result
}

pub fn filter_tokens<F>(dict: &TokenDictionary, mut predicate: F) -> TokenDictionary
where
    F: FnMut(&str, &str) -> bool,
{
    let mut result = TokenDictionary::new();
    for (k, v) in dict.iter() {
        if predicate(k, v) {
            result.insert(k.to_string(), v.to_string());
        }
    }
    result
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TokenTreeNode {
    Leaf(String),
    Branch(Vec<(String, TokenTreeNode)>),
}

const LEAF_KEY: &str = "$value";
const FORBIDDEN_SEGMENTS: [&str; 3] = ["__proto__", "constructor", "prototype"];

pub fn nest_tokens(delimiter: &str, dict: &TokenDictionary) -> Result<TokenTreeNode, OkyctError> {
    if delimiter.is_empty() {
        return Err(OkyctError::new(
            "Invalid delimiter for nestTokens: expected a non-empty string.",
        ));
    }

    let mut root_entries: Vec<(String, TokenTreeNode)> = Vec::new();
    let mut value_slot_sources: HashMap<String, String> = HashMap::new();

    for (key, val) in dict.iter() {
        let stripped = key.strip_prefix("--").unwrap_or(key);
        let parts: Vec<&str> = stripped.split(delimiter).filter(|p| !p.is_empty()).collect();
        if parts.is_empty() {
            return Err(OkyctError::new(format!(
                "Invalid token key \"{key}\" for nestTokens: produces no path segments."
            )));
        }
        if parts.iter().any(|p| FORBIDDEN_SEGMENTS.contains(p)) {
            return Err(OkyctError::new(format!(
                "Forbidden token key segment in \"{key}\"."
            )));
        }

        let value_slot = if parts.last() == Some(&LEAF_KEY) {
            parts.join("\0")
        } else {
            format!("{}\0{LEAF_KEY}", parts.join("\0"))
        };
        if let Some(existing_source) = value_slot_sources.get(&value_slot) {
            return Err(OkyctError::new(format!(
                "Token path collision in nestTokens(\"{delimiter}\"): \"{existing_source}\" and \"{key}\" map to the same path \"{}\".",
                parts.join(".")
            )));
        }
        value_slot_sources.insert(value_slot, key.to_string());

        fn insert_path(
            branch: &mut Vec<(String, TokenTreeNode)>,
            parts: &[&str],
            val: &str,
        ) {
            let part = parts[0];
            let is_last = parts.len() == 1;
            let pos = branch.iter().position(|(k, _)| k == part);

            if is_last {
                match pos {
                    Some(idx) => {
                        if let TokenTreeNode::Branch(sub) = &mut branch[idx].1 {
                            if let Some(leaf_entry) = sub.iter_mut().find(|(k, _)| k == LEAF_KEY) {
                                leaf_entry.1 = TokenTreeNode::Leaf(val.to_string());
                            } else {
                                sub.push((LEAF_KEY.to_string(), TokenTreeNode::Leaf(val.to_string())));
                            }
                        } else {
                            branch[idx].1 = TokenTreeNode::Leaf(val.to_string());
                        }
                    }
                    None => {
                        branch.push((part.to_string(), TokenTreeNode::Leaf(val.to_string())));
                    }
                }
                return;
            }

            let idx = match pos {
                Some(i) => {
                    if let TokenTreeNode::Leaf(existing_val) = &branch[i].1 {
                        let moved = existing_val.clone();
                        branch[i].1 = TokenTreeNode::Branch(vec![(
                            LEAF_KEY.to_string(),
                            TokenTreeNode::Leaf(moved),
                        )]);
                    }
                    i
                }
                None => {
                    branch.push((part.to_string(), TokenTreeNode::Branch(Vec::new())));
                    branch.len() - 1
                }
            };

            if let TokenTreeNode::Branch(sub) = &mut branch[idx].1 {
                insert_path(sub, &parts[1..], val);
            }
        }

        insert_path(&mut root_entries, &parts, val);
    }

    Ok(TokenTreeNode::Branch(root_entries))
}

pub fn flatten_tokens(
    delimiter: &str,
    tree: &TokenTreeNode,
) -> Result<TokenDictionary, OkyctError> {
    if delimiter.is_empty() {
        return Err(OkyctError::new(
            "Invalid delimiter for flattenTokens: expected a non-empty string.",
        ));
    }
    let TokenTreeNode::Branch(entries) = tree else {
        return Err(OkyctError::new(
            "Invalid token tree for flattenTokens: expected a branch node.",
        ));
    };

    let mut result = TokenDictionary::new();
    fn recurse(
        entries: &[(String, TokenTreeNode)],
        path: &mut Vec<String>,
        delimiter: &str,
        result: &mut TokenDictionary,
    ) {
        for (k, v) in entries {
            if k.starts_with('$') {
                continue;
            }
            path.push(k.clone());
            match v {
                TokenTreeNode::Branch(sub) => {
                    if let Some((_, TokenTreeNode::Leaf(leaf))) =
                        sub.iter().find(|(sk, _)| sk == LEAF_KEY)
                    {
                        result.insert(path.join(delimiter), leaf.clone());
                    }
                    recurse(sub, path, delimiter, result);
                }
                TokenTreeNode::Leaf(val) => {
                    result.insert(path.join(delimiter), val.clone());
                }
            }
            path.pop();
        }
    }

    let mut path = Vec::new();
    recurse(entries, &mut path, delimiter, &mut result);
    Ok(result)
}

#[inline]
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

pub fn with_alpha(opacity: f64, color_or_var: &str) -> Result<String, OkyctError> {
    if !opacity.is_finite() {
        return Err(OkyctError::new(format!(
            "Invalid opacity for withAlpha: {opacity}. Expected a finite number in [0, 1]."
        )));
    }
    let alpha = opacity.clamp(0.0, 1.0);
    let trimmed = trim_ascii_whitespace(color_or_var);
    if trimmed.is_empty() {
        return Err(OkyctError::new(
            "Invalid color or CSS variable input for withAlpha: expected a non-empty string.",
        ));
    }

    if trimmed.starts_with("var(") || trimmed.starts_with("--") {
        let var_expr = if trimmed.starts_with("--") {
            format!("var({trimmed})")
        } else {
            trimmed.to_string()
        };
        let pct = js_round(alpha * 100.0) as i64;
        return Ok(format!("color-mix(in srgb, {var_expr} {pct}%, transparent)"));
    }

    if let Some(hex_body) = trimmed.strip_prefix('#') {
        if hex_body.len() == 3 && hex_body.bytes().all(|b| b.is_ascii_hexdigit()) {
            let mut expanded = String::from("#");
            for ch in hex_body.chars() {
                expanded.push(ch);
                expanded.push(ch);
            }
            let alpha_byte = js_round(alpha * 255.0) as u8;
            return Ok(format!("{expanded}{alpha_byte:02x}").to_ascii_uppercase());
        }
        if hex_body.len() == 6 && hex_body.bytes().all(|b| b.is_ascii_hexdigit()) {
            let alpha_byte = js_round(alpha * 255.0) as u8;
            return Ok(format!("{trimmed}{alpha_byte:02x}").to_ascii_uppercase());
        }
    }

    let pct = js_round(alpha * 100.0) as i64;
    Ok(format!("color-mix(in srgb, {trimmed} {pct}%, transparent)"))
}

pub fn to_css_var_ref(
    prefix: Option<&str>,
    fallback: Option<&str>,
    token_key: &str,
) -> Result<String, OkyctError> {
    let trimmed_leading = token_key.trim_start_matches(['-', ' ', '\t', '\n', '\r', '\x0C']);
    let clean_key = trim_ascii_whitespace(trimmed_leading);
    if clean_key.is_empty() {
        return Err(OkyctError::new(
            "Invalid tokenKey for toCssVarRef: expected a non-empty token name.",
        ));
    }
    let p = match prefix {
        Some(px) if !px.is_empty() => {
            if px.ends_with('-') {
                px.to_string()
            } else {
                format!("{px}-")
            }
        }
        _ => "--".to_string(),
    };
    let var_name = format!("{p}{clean_key}");
    match fallback {
        Some(fb) if !fb.is_empty() => Ok(format!("var({var_name}, {fb})")),
        _ => Ok(format!("var({var_name})")),
    }
}

pub fn to_css_rule_block(selector: &str, dict: &TokenDictionary) -> Result<String, OkyctError> {
    let trimmed_selector = trim_ascii_whitespace(selector);
    if trimmed_selector.is_empty() {
        return Err(OkyctError::new(
            "Invalid CSS selector for toCssRuleBlock: expected a non-empty string.",
        ));
    }
    let lines: Vec<String> = dict
        .iter()
        .map(|(k, v)| {
            let key_name = if k.starts_with("--") {
                k.to_string()
            } else {
                format!("--{k}")
            };
            format!("  {key_name}: {v};")
        })
        .collect();
    Ok(format!("{trimmed_selector} {{\n{}\n}}", lines.join("\n")))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ContractValidationReport {
    pub valid: bool,
    pub missing_keys: Vec<String>,
    pub extra_keys: Vec<String>,
    pub total_checked: usize,
}

pub fn validate_contract(required_keys: &[&str], dict: &TokenDictionary) -> ContractValidationReport {
    let req_set: HashSet<&str> = required_keys.iter().copied().collect();
    let mut dict_keys: Vec<String> = Vec::new();
    let mut dict_set: HashSet<String> = HashSet::new();
    for k in dict.keys() {
        let stripped = k.strip_prefix("--").unwrap_or(k).to_string();
        if dict_set.insert(stripped.clone()) {
            dict_keys.push(stripped);
        }
    }

    let missing_keys: Vec<String> = required_keys
        .iter()
        .filter(|&&k| !dict_set.contains(k))
        .map(|&k| k.to_string())
        .collect();
    let extra_keys: Vec<String> = dict_keys
        .into_iter()
        .filter(|k| !req_set.contains(k.as_str()))
        .collect();

    ContractValidationReport {
        valid: missing_keys.is_empty(),
        missing_keys,
        extra_keys,
        total_checked: required_keys.len(),
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ThemeParityReport {
    pub is_symmetric: bool,
    pub asymmetry_keys: Vec<String>,
}

pub fn diff_theme_parity(
    reference_dict: &TokenDictionary,
    target_dict: &TokenDictionary,
) -> ThemeParityReport {
    let ref_keys: HashSet<&str> = reference_dict.keys().collect();
    let target_keys: HashSet<&str> = target_dict.keys().collect();

    let mut asymmetry_keys = Vec::new();
    for k in reference_dict.keys() {
        if !target_keys.contains(k) {
            asymmetry_keys.push(format!("Target missing: {k}"));
        }
    }
    for k in target_dict.keys() {
        if !ref_keys.contains(k) {
            asymmetry_keys.push(format!("Reference missing: {k}"));
        }
    }

    ThemeParityReport {
        is_symmetric: asymmetry_keys.is_empty(),
        asymmetry_keys,
    }
}
