export const withAlpha = (opacity: number) => {
  if (!Number.isFinite(opacity)) {
    throw new Error(`Invalid opacity for withAlpha: ${opacity}. Expected a finite number in [0, 1].`)
  }
  const alpha = Math.max(0, Math.min(1, opacity))

  return (colorOrVar: string): string => {
    if (typeof colorOrVar !== 'string' || colorOrVar.trim().length === 0) {
      throw new Error('Invalid color or CSS variable input for withAlpha: expected a non-empty string.')
    }
    const trimmed = colorOrVar.trim()

    if (trimmed.startsWith('var(') || trimmed.startsWith('--')) {
      const varExpr = trimmed.startsWith('--') ? `var(${trimmed})` : trimmed
      const pct = Math.round(alpha * 100)
      return `color-mix(in srgb, ${varExpr} ${pct}%, transparent)`
    }

    if (/^#([0-9a-f]{3})$/i.test(trimmed)) {
      const expanded = '#' + trimmed.slice(1).split('').map((c) => c + c).join('')
      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0')
      return `${expanded}${alphaHex}`.toUpperCase()
    }

    if (/^#([0-9a-f]{6})$/i.test(trimmed)) {
      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0')
      return `${trimmed}${alphaHex}`.toUpperCase()
    }

    return `color-mix(in srgb, ${trimmed} ${Math.round(alpha * 100)}%, transparent)`
  }
}
