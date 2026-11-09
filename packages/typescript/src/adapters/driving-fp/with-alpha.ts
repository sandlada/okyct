
export const withAlpha = (opacity: number) =>
  (colorOrVar: string): string => {
    const alpha = Math.max(0, Math.min(1, opacity))
    const trimmed = colorOrVar.trim()

    if (trimmed.startsWith('var(') || trimmed.startsWith('--')) {
      const varExpr = trimmed.startsWith('--') ? `var(${trimmed})` : trimmed
      const pct = Math.round(alpha * 100)
      return `color-mix(in srgb, ${varExpr} ${pct}%, transparent)`
    }

    if (/^#([0-9a-f]{6})$/i.test(trimmed)) {
      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0')
      return `${trimmed}${alphaHex}`.toUpperCase()
    }

    return `color-mix(in srgb, ${trimmed} ${Math.round(alpha * 100)}%, transparent)`
  }
