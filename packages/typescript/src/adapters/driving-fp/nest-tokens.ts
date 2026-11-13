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
    for (const [key, val] of Object.entries(normalized)) {
      const parts = key.replace(/^--/, '').split(delimiter).filter((part) => part.length > 0)
      if (parts.length === 0) continue
      if (parts.some((part) => ForbiddenSegmentKeys.has(part))) {
        throw new Error(`Forbidden token key segment in "${key}".`)
      }

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
