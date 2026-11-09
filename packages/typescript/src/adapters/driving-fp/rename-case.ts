/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TokenDictionary, NamingCase } from './token-dictionary.ts'

export const renameCase = (targetCase: NamingCase) =>
  (dict: TokenDictionary): TokenDictionary => {
    const toKebab = (s: string) => s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase().replace(/^-+/, '')
    const toCamel = (s: string) => s.replace(/[-_]([a-z0-9])/gi, (_, c) => c.toUpperCase())
    const toSnake = (s: string) => toKebab(s).replace(/-/g, '_')
    const toConstant = (s: string) => toSnake(s).toUpperCase()

    const transform = {
      kebab: toKebab,
      camel: toCamel,
      snake: toSnake,
      constant: toConstant,
    }[targetCase]

    const result: TokenDictionary = {}
    for (const [key, val] of Object.entries(dict)) {
      result[transform(key)] = val
    }
    return result
  }
