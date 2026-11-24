export function serializeCanonicalJson(value: Record<string, unknown>): string {
  const serialized = JSON.stringify(value, null, 2)
  return serialized.includes('\r\n') ? serialized.replaceAll('\r\n', '\n') : serialized
}
