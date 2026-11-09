
import type { TokenDictionary } from './token-dictionary.ts'

export const toCssRuleBlock = (selector: string) =>
  (dict: TokenDictionary): string => {
    const lines = Object.entries(dict).map(([k, v]) => {
      const keyName = k.startsWith('--') ? k : `--${k}`
      return `  ${keyName}: ${v};`
    })
    return `${selector} {\n${lines.join('\n')}\n}`
  }
