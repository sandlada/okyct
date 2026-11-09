/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TokenDictionary } from './token-dictionary.ts'

export const mapTokens = (mapper: (val: string, key: string) => string) =>
  (dict: TokenDictionary): TokenDictionary => {
    const result: TokenDictionary = {}
    for (const [k, v] of Object.entries(dict)) {
      result[k] = mapper(v, k)
    }
    return result
  }
