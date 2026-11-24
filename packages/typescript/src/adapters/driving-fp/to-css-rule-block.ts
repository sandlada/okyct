import type { TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'
import { trimAsciiWhitespace } from '../../domain/index.ts'

export const toCssRuleBlock = (selector: string) => {
  const trimmedSelector = trimAsciiWhitespace(selector)
  if (trimmedSelector.length === 0) {
    throw new Error('Invalid CSS selector for toCssRuleBlock: expected a non-empty string.')
  }

  return (dict: TokenSource): string => {
    const normalized = normalizeTokenDict(dict)
    const lines = Object.entries(normalized).map(([k, v]) => {
      const keyName = k.startsWith('--') ? k : `--${k}`
      return `  ${keyName}: ${v};`
    })
    return `${trimmedSelector} {\n${lines.join('\n')}\n}`
  }
}
