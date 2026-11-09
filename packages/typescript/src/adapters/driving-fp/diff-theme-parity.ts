/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TokenDictionary } from './token-dictionary.ts'

export const diffThemeParity = (referenceDict: TokenDictionary) =>
  (targetDict: TokenDictionary): { isSymmetric: boolean; asymmetryKeys: string[] } => {
    const refKeys = new Set(Object.keys(referenceDict))
    const targetKeys = new Set(Object.keys(targetDict))

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
