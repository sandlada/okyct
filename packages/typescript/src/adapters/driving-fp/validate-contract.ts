import type { TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'

export interface ContractValidationReport {
  valid: boolean
  missingKeys: string[]
  extraKeys: string[]
  totalChecked: number
}

export const validateContract = (requiredKeys: readonly string[]) => {
  if (!Array.isArray(requiredKeys)) {
    throw new Error('Invalid requiredKeys argument for validateContract: expected an array of token key strings.')
  }
  const reqSet = new Set(requiredKeys)
  return (dict: TokenSource): ContractValidationReport => {
    const normalized = normalizeTokenDict(dict)
    const dictKeys = new Set(Object.keys(normalized).map(k => k.replace(/^--/, '')))

    const missingKeys = requiredKeys.filter(k => !dictKeys.has(k))
    const extraKeys = Array.from(dictKeys).filter(k => !reqSet.has(k))

    return {
      valid: missingKeys.length === 0,
      missingKeys,
      extraKeys,
      totalChecked: requiredKeys.length,
    }
  }
}
