import { EmissivePanelTypes, type EmissivePanelType } from '../../ports/outbound/display-physics.port.ts'
import type { TokenDictionary, TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'
import { applyEmissiveProfileToTokenHex } from '../driven-emissive-oled/index.ts'

export const optimizeForOled = (options: {
  profile: EmissivePanelType
  burnInGuard?: boolean
  antiFringing?: boolean
}) => {
  if (!EmissivePanelTypes.includes(options.profile)) {
    throw new Error(
      `Invalid emissive profile: "${String(options.profile)}". Expected one of: ${EmissivePanelTypes.join(', ')}.`
    )
  }

  return (dict: TokenSource): TokenDictionary => {
    const normalized = normalizeTokenDict(dict)
    const result: TokenDictionary = {}
    for (const [k, v] of Object.entries(normalized)) {
      result[k] = applyEmissiveProfileToTokenHex(k, v, options)
    }
    return result
  }
}
