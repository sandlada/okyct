
import type { TokenDictionary } from './token-dictionary.ts'

export const flattenTokens = (delimiter = '-') =>
  (tree: Record<string, any>): TokenDictionary => {
    const result: TokenDictionary = {}
    const recurse = (obj: Record<string, any>, currentPath: string[]) => {
      for (const [k, v] of Object.entries(obj)) {
        const newPath = [...currentPath, k]
        if (v && typeof v === 'object' && !Array.isArray(v) && !('$value' in v)) {
          recurse(v, newPath)
        } else {
          const leafVal = v && typeof v === 'object' && '$value' in v ? v.$value : String(v)
          result[newPath.join(delimiter)] = leafVal
        }
      }
    }
    recurse(tree, [])
    return result
  }
