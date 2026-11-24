use std::fmt::Write;

#[derive(Debug, Clone)]
pub enum JsonValue {
    String(String),
    Object(Vec<(String, JsonValue)>),
}

/// ECMA-262 QuoteJSONString (ES2019 Well-Formed JSON):
/// - Preserves valid UTF-8 characters including supplementary plane (emoji, CJK Ext B) verbatim.
/// - Escapes quotes, backslashes, and control characters (< 0x20) with lowercase \uXXXX.
pub fn write_json_string(out: &mut String, s: &str) {
    out.push('"');
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\u{0008}' => out.push_str("\\b"),
            '\u{000C}' => out.push_str("\\f"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                let _ = write!(out, "\\u{:04x}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

fn write_indent(out: &mut String, depth: usize) {
    for _ in 0..depth {
        out.push_str("  ");
    }
}

fn write_value(out: &mut String, value: &JsonValue, depth: usize) {
    match value {
        JsonValue::String(s) => write_json_string(out, s),
        JsonValue::Object(entries) => {
            if entries.is_empty() {
                out.push_str("{}");
                return;
            }
            out.push_str("{\n");
            for (i, (k, v)) in entries.iter().enumerate() {
                write_indent(out, depth + 1);
                write_json_string(out, k);
                out.push_str(": ");
                write_value(out, v, depth + 1);
                if i + 1 < entries.len() {
                    out.push(',');
                }
                out.push('\n');
            }
            write_indent(out, depth);
            out.push('}');
        }
    }
}

pub fn serialize_canonical_json(value: &JsonValue) -> String {
    let mut out = String::new();
    write_value(&mut out, value, 0);
    out
}
