
import type { TokenDictionary } from './token-dictionary.ts'

const LeafKey = '$value'

function asBranch(node: unknown): Record<string, unknown> {
  if (node !== null && typeof node === 'object') {
    return node as Record<string, unknown>
  }
  return { [LeafKey]: node }
}

export const nestTokens = (delimiter = '-') =>
  (dict: TokenDictionary): Record<string, unknown> => {
    const root: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(dict)) {
      const parts = key.replace(/^--/, '').split(delimiter).filter((part) => part.length > 0)
      if (parts.length === 0) continue
      let current = root
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!
        const last = i === parts.length - 1
        if (last) {
          const existing = current[part]
          if (existing !== null && typeof existing === 'object') {
            ;(existing as Record<string, unknown>)[LeafKey] = val
          } else {
            current[part] = val
          }
          continue
        }
        current[part] = asBranch(current[part])
        current = current[part] as Record<string, unknown>
      }
    }
    return root
  }
