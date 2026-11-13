import type { TokenDictionary, TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'

export const filterTokens = (predicate: (key: string, value: string) => boolean) => {
  if (typeof predicate !== 'function') {
    throw new Error(`Invalid predicate for filterTokens: expected function, received ${typeof predicate}.`)
  }
  return (dict: TokenSource): TokenDictionary => {
    const normalized = normalizeTokenDict(dict)
    const result: TokenDictionary = {}
    for (const [k, v] of Object.entries(normalized)) {
      if (predicate(k, v)) {
        result[k] = v
      }
    }
    return result
  }
}
