/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TokenDictionary } from './token-dictionary.ts'

export const pickTokens = (keys: readonly string[]) =>
  (dict: TokenDictionary): TokenDictionary => {
    const result: TokenDictionary = {}
    for (const k of keys) {
      if (k in dict) {
        result[k] = dict[k]
      }
    }
    return result
  }
