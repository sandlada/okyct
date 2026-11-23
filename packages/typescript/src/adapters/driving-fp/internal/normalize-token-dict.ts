import { type DynamicSchemeColors } from '../../../ports/index.ts'
import type { TokenDictionary, TokenSource } from '../token-dictionary.ts'
import { toTokenDictionary } from '../to-token-dictionary.ts'

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

  if (isDynamicScheme(source)) {
    return toTokenDictionary(source, [], { includeStateLayers: true })
  }

  const result: TokenDictionary = {}
  for (const [key, value] of Object.entries(source)) {
    if (typeof value !== 'string') {
      throw new Error(`Invalid token value for "${key}": expected string, received ${typeof value}.`)
    }
    result[key] = value
  }
  return result
}
