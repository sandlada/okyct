/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TokenDictionary } from './token-dictionary.ts'

export const omitTokens = (keys: readonly string[]) =>
  (dict: TokenDictionary): TokenDictionary => {
    const keySet = new Set(keys)
    const result: TokenDictionary = {}
    for (const [k, v] of Object.entries(dict)) {
      if (!keySet.has(k)) {
        result[k] = v
      }
    }
    return result
  }
