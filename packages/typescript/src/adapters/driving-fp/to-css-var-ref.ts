import { trimAsciiWhitespace } from './internal/trim-ascii-whitespace.ts'

export const toCssVarRef = (options: { prefix?: string; fallback?: string } = {}) =>
  (tokenKey: string): string => {
    if (typeof tokenKey !== 'string') {
      throw new Error(`Invalid tokenKey for toCssVarRef: expected string, received ${typeof tokenKey}.`)
    }
    const cleanKey = trimAsciiWhitespace(tokenKey.replace(/^[- \t\n\r\f]+/, ''))
    if (cleanKey.length === 0) {
      throw new Error('Invalid tokenKey for toCssVarRef: expected a non-empty token name.')
    }
    const p = options.prefix ? (options.prefix.endsWith('-') ? options.prefix : `${options.prefix}-`) : '--'
    const varName = `${p}${cleanKey}`
    return options.fallback ? `var(${varName}, ${options.fallback})` : `var(${varName})`
  }
