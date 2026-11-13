import type { TokenDictionary, TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'

export const pickTokens = (keys: readonly string[]) => {
  if (!Array.isArray(keys)) {
    throw new Error('Invalid keys argument for pickTokens: expected an array of token key strings.')
  }
  return (dict: TokenSource): TokenDictionary => {
    const normalized = normalizeTokenDict(dict)
    const result: TokenDictionary = {}
    for (const k of keys) {
      if (Object.hasOwn(normalized, k)) {
        result[k] = normalized[k]!
      }
    }
    return result
  }
}
