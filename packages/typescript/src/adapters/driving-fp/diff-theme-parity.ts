import type { TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'

export const diffThemeParity = (referenceDict: TokenSource) => {
  const normalizedRef = normalizeTokenDict(referenceDict)
  const refKeys = new Set(Object.keys(normalizedRef))

  return (targetDict: TokenSource): { isSymmetric: boolean; asymmetryKeys: string[] } => {
    const normalizedTarget = normalizeTokenDict(targetDict)
    const targetKeys = new Set(Object.keys(normalizedTarget))

    const asymmetryKeys: string[] = []
    for (const k of refKeys) {
      if (!targetKeys.has(k)) asymmetryKeys.push(`Target missing: ${k}`)
    }
    for (const k of targetKeys) {
      if (!refKeys.has(k)) asymmetryKeys.push(`Reference missing: ${k}`)
    }

    return {
      isSymmetric: asymmetryKeys.length === 0,
      asymmetryKeys,
    }
  }
}
