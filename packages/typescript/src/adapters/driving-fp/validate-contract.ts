
import type { TokenDictionary } from './token-dictionary.ts'

export interface ContractValidationReport {
  valid: boolean
  missingKeys: string[]
  extraKeys: string[]
  totalChecked: number
}

export const validateContract = (requiredKeys: readonly string[]) =>
  (dict: TokenDictionary): ContractValidationReport => {
    const dictKeys = new Set(Object.keys(dict).map(k => k.replace(/^--/, '')))
    const reqSet = new Set(requiredKeys)

    const missingKeys = requiredKeys.filter(k => !dictKeys.has(k))
    const extraKeys = Array.from(dictKeys).filter(k => !reqSet.has(k))

    return {
      valid: missingKeys.length === 0,
      missingKeys,
      extraKeys,
      totalChecked: requiredKeys.length,
    }
  }
