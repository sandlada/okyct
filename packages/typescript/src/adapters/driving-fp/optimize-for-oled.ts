
import type { EmissivePanelType } from '../../ports/outbound/display-physics.port.ts'
import type { TokenDictionary } from './token-dictionary.ts'
import { applyEmissiveProfileToTokenHex } from '../driven-emissive-oled/index.ts'

export const optimizeForOled = (options: {
  profile: EmissivePanelType
  burnInGuard?: boolean
  antiFringing?: boolean
}) =>
  (dict: TokenDictionary): TokenDictionary => {
    const result: TokenDictionary = {}
    for (const [k, v] of Object.entries(dict)) {
      result[k] = applyEmissiveProfileToTokenHex(k, v, options)
    }
    return result
  }
