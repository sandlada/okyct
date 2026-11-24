use crate::domain::services::trim_ascii_whitespace;

pub fn kebab_case(input: &str) -> String {
    let mut spaced = String::with_capacity(input.len() + 8);
    let chars: Vec<char> = input.chars().collect();
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

    let trimmed = trim_ascii_whitespace(&spaced);
    let mut result = String::new();
    for word in trimmed.split(['-', '_', ' ', '\t', '\n', '\r', '\x0C']) {
        if word.is_empty() {
            continue;
        }
        if !result.is_empty() {
            result.push('-');
        }
        result.push_str(&word.to_ascii_lowercase());
    }
    result
}
