function isAsciiWhitespaceCode(code: number): boolean {
  return code === 32 || code === 9 || code === 10 || code === 13 || code === 12
}

/**
 * Trims leading and trailing W3C CSS / WHATWG ASCII whitespace
 * (`' '`, `'\t'`, `'\n'`, `'\r'`, `'\f'`), rejecting non-ASCII whitespace such as U+0085 / U+FEFF / U+00A0 / U+3000.
 */
export function trimAsciiWhitespace(value: string): string {
  const len = value.length
  if (len === 0) return value
  let start = 0
  let end = len - 1
  if (!isAsciiWhitespaceCode(value.charCodeAt(start)) && !isAsciiWhitespaceCode(value.charCodeAt(end))) {
    return value
  }
  while (start <= end && isAsciiWhitespaceCode(value.charCodeAt(start))) start++
  while (end >= start && isAsciiWhitespaceCode(value.charCodeAt(end))) end--
  return start > end ? '' : value.slice(start, end + 1)
}
