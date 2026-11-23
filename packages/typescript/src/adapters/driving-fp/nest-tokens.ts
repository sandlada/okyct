import type { TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'

const LeafKey = '$value'
const ForbiddenSegmentKeys = new Set(['__proto__', 'constructor', 'prototype'])

function asBranch(node: unknown): Record<string, unknown> {
  if (node === undefined) {
    return {}
  }
  if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
    return node as Record<string, unknown>
  }
  return { [LeafKey]: node }
}

export const nestTokens = (delimiter = '-') => {
  if (typeof delimiter !== 'string' || delimiter.length === 0) {
    throw new Error('Invalid delimiter for nestTokens: expected a non-empty string.')
  }

  return (dict: TokenSource): Record<string, unknown> => {
    const normalized = normalizeTokenDict(dict)
    const root: Record<string, unknown> = {}
    const valueSlotSources = new Map<string, string>()
    for (const [key, val] of Object.entries(normalized)) {
      const parts = key.replace(/^--/, '').split(delimiter).filter((part) => part.length > 0)
      if (parts.length === 0) {
        throw new Error(`Invalid token key "${key}" for nestTokens: produces no path segments.`)
      }
      if (parts.some((part) => ForbiddenSegmentKeys.has(part))) {
        throw new Error(`Forbidden token key segment in "${key}".`)
      }

      const valueSlot =
        parts[parts.length - 1] === LeafKey
          ? parts.join('\0')
          : `${parts.join('\0')}\0${LeafKey}`
      const existingSource = valueSlotSources.get(valueSlot)
      if (existingSource !== undefined) {
        throw new Error(
          `Token path collision in nestTokens("${delimiter}"): "${existingSource}" and "${key}" map to the same path "${parts.join('.')}".`
        )
      }
      valueSlotSources.set(valueSlot, key)

      let current = root
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!
        const last = i === parts.length - 1
        const existing = Object.hasOwn(current, part) ? current[part] : undefined
        if (last) {
          if (existing !== null && existing !== undefined && typeof existing === 'object' && !Array.isArray(existing)) {
            ;(existing as Record<string, unknown>)[LeafKey] = val
          } else {
            current[part] = val
          }
          continue
        }
        const branch = asBranch(existing)
        current[part] = branch
        current = branch
      }
    }
    return root
  }
}
