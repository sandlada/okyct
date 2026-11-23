export function registerTokenKey(
  registry: Map<string, string>,
  key: string,
  sourceLabel: string,
  context: string
): void {
  const existing = registry.get(key)
  if (existing !== undefined) {
    throw new Error(
      `Token key collision in ${context}: "${key}" from ${sourceLabel} conflicts with ${existing}.`
    )
  }
  registry.set(key, sourceLabel)
}
