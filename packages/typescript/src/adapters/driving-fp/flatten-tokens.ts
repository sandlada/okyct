
import type { TokenDictionary } from './token-dictionary.ts'

export const flattenTokens = (delimiter = '-') =>
  (tree: Record<string, unknown>): TokenDictionary => {
    const result: TokenDictionary = {}
    const recurse = (obj: Record<string, unknown>, currentPath: string[]) => {
      for (const [k, v] of Object.entries(obj)) {
        const newPath = [...currentPath, k]
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && !('$value' in v)) {
          recurse(v as Record<string, unknown>, newPath)
        } else {
          const leafVal =
            v !== null && typeof v === 'object' && '$value' in v
              ? String((v as { $value: unknown }).$value)
              : String(v)
          result[newPath.join(delimiter)] = leafVal
        }
      }
    }
    recurse(tree, [])
    return result
  }
