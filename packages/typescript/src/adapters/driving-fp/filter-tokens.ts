
import type { TokenDictionary } from './token-dictionary.ts'

export const filterTokens = (predicate: (key: string, value: string) => boolean) =>
  (dict: TokenDictionary): TokenDictionary => {
    const result: TokenDictionary = {}
    for (const [k, v] of Object.entries(dict)) {
      if (predicate(k, v)) {
        result[k] = v
      }
    }
    return result
  }
