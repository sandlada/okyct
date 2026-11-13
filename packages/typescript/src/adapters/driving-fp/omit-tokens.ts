import type { TokenDictionary, TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'

export const omitTokens = (keys: readonly string[]) => {
  if (!Array.isArray(keys)) {
    throw new Error('Invalid keys argument for omitTokens: expected an array of token key strings.')
  }
  const keySet = new Set(keys)
  return (dict: TokenSource): TokenDictionary => {
    const normalized = normalizeTokenDict(dict)
    const result: TokenDictionary = {}
    for (const [k, v] of Object.entries(normalized)) {
      if (!keySet.has(k)) {
        result[k] = v
      }
    }
    return result
  }
}
