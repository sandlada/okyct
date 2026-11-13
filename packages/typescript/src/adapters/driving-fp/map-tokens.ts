import type { TokenDictionary, TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'

export const mapTokens = (mapper: (val: string, key: string) => string) => {
  if (typeof mapper !== 'function') {
    throw new Error(`Invalid mapper for mapTokens: expected function, received ${typeof mapper}.`)
  }
  return (dict: TokenSource): TokenDictionary => {
    const normalized = normalizeTokenDict(dict)
    const result: TokenDictionary = {}
    for (const [k, v] of Object.entries(normalized)) {
      result[k] = mapper(v, k)
    }
    return result
  }
}
