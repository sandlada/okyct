import { SystemColorTokens, type DynamicSchemeColors } from '../../../ports/index.ts'
import type { TokenDictionary, TokenSource } from '../token-dictionary.ts'

function isDynamicScheme(source: TokenSource): source is DynamicSchemeColors {
  return (
    'tones' in source &&
    source.tones !== null &&
    typeof source.tones === 'object' &&
    !Array.isArray(source.tones)
  )
}

export function normalizeTokenDict(source: TokenSource): TokenDictionary {
  if (source === null || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('Invalid token dictionary: expected a TokenDictionary object or DynamicSchemeColors.')
  }

  const result: TokenDictionary = {}
  if (isDynamicScheme(source)) {
    for (const key of SystemColorTokens) {
      const value = source[key]
      if (typeof value === 'string') {
        result[key] = value
      }
    }
    for (const [key, value] of Object.entries(source)) {
      if (key === 'tones' || Object.hasOwn(result, key)) continue
      if (typeof value !== 'string') {
        throw new Error(`Invalid token value for "${key}": expected string, received ${typeof value}.`)
      }
      result[key] = value
    }
    return result
  }

  for (const [key, value] of Object.entries(source)) {
    if (typeof value !== 'string') {
      throw new Error(`Invalid token value for "${key}": expected string, received ${typeof value}.`)
    }
    result[key] = value
  }
  return result
}
