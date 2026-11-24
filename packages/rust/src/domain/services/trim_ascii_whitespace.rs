#[inline]
fn is_ascii_whitespace_byte(b: u8) -> bool {
    matches!(b, b' ' | b'\t' | b'\n' | b'\r' | 0x0C)
}

/// Trims leading and trailing W3C CSS / WHATWG ASCII whitespace
/// (`' '`, `'\t'`, `'\n'`, `'\r'`, `'\f'`), rejecting non-ASCII whitespace.
pub fn trim_ascii_whitespace(value: &str) -> &str {
    let bytes = value.as_bytes();
    let mut start = 0;
    let mut end = bytes.len();
    while start < end && is_ascii_whitespace_byte(bytes[start]) {
        start += 1;
    }
    while end > start && is_ascii_whitespace_byte(bytes[end - 1]) {
        end -= 1;
    }
    &value[start..end]
}
