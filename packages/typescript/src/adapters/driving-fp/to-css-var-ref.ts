
export const toCssVarRef = (options: { prefix?: string; fallback?: string } = {}) =>
  (tokenKey: string): string => {
    const p = options.prefix ? (options.prefix.endsWith('-') ? options.prefix : `${options.prefix}-`) : '--'
    const cleanKey = tokenKey.replace(/^[-\s]+/, '')
    const varName = `${p}${cleanKey}`
    return options.fallback ? `var(${varName}, ${options.fallback})` : `var(${varName})`
  }
