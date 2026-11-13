
export const stackToCssColorMix = (options: { space?: 'oklch' | 'srgb' } = {}) => {
  const space = options.space ?? 'oklch'
  if (space !== 'oklch' && space !== 'srgb') {
    throw new Error(`Invalid color-mix space: "${String(space)}". Expected 'oklch' or 'srgb'.`)
  }

  return (layers: ReadonlyArray<{ color: string; opacity: number }>) => {
    if (!Array.isArray(layers)) {
      throw new Error('Invalid layers input: expected an array of { color, opacity } entries.')
    }

    return (baseExpr: string): string => {
      if (typeof baseExpr !== 'string' || baseExpr.trim().length === 0) {
        throw new Error('Invalid baseExpr for stackToCssColorMix: expected a non-empty string.')
      }
      let currentExpr = baseExpr

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        if (typeof layer.color !== 'string' || layer.color.trim().length === 0) {
          throw new Error(`Invalid layer color at index ${i}: expected a non-empty string.`)
        }
        if (!Number.isFinite(layer.opacity)) {
          throw new Error(`Invalid layer opacity at index ${i}: ${layer.opacity}. Expected a finite number.`)
        }
        const clampedOpacity = Math.max(0, Math.min(1, layer.opacity))
        const pct = Number((clampedOpacity * 100).toFixed(2))
        const remainPct = Number((100 - pct).toFixed(2))
        currentExpr = `color-mix(in ${space}, ${currentExpr} ${remainPct}%, ${layer.color} ${pct}%)`
      }

      return currentExpr
    }
  }
}
