/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TokenDictionary } from './token-dictionary.ts'

export const withPrefix = (prefix: string) =>
  (dict: TokenDictionary): TokenDictionary => {
    const cleanPrefix = prefix.endsWith('-') ? prefix : `${prefix}-`
    const result: TokenDictionary = {}
    for (const [key, val] of Object.entries(dict)) {
      const cleanKey = key.startsWith('--') ? key.slice(2) : key
      result[`${cleanPrefix}${cleanKey}`] = val
    }
    return result
  }
