import type { TokenDictionary, TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'
import { trimAsciiWhitespace } from './internal/trim-ascii-whitespace.ts'

export const withPrefix = (prefix: string) => {
  if (typeof prefix !== 'string') {
    throw new Error(`Invalid prefix for withPrefix: expected string, received ${typeof prefix}.`)
  }
  const trimmedPrefix = trimAsciiWhitespace(prefix)

  return (dict: TokenSource): TokenDictionary => {
    const normalized = normalizeTokenDict(dict)
    if (trimmedPrefix.length === 0) {
      return { ...normalized }
    }
    const cleanPrefix = trimmedPrefix.endsWith('-') ? trimmedPrefix : `${trimmedPrefix}-`
    const result: TokenDictionary = {}
    for (const [key, val] of Object.entries(normalized)) {
      const cleanKey = key.startsWith('--') ? key.slice(2) : key
      result[`${cleanPrefix}${cleanKey}`] = val
    }
    return result
  }
}
