export function trimAsciiWhitespace(value: string): string {
  const len = value.length
  if (len === 0) return value
  let start = 0
  let end = len - 1
  const isWs = (c: number) => c === 32 || c === 9 || c === 10 || c === 13 || c === 12
  if (!isWs(value.charCodeAt(start)) && !isWs(value.charCodeAt(end))) return value
  while (start <= end && isWs(value.charCodeAt(start))) start++
  while (end >= start && isWs(value.charCodeAt(end))) end--
  return start > end ? '' : value.slice(start, end + 1)
}
