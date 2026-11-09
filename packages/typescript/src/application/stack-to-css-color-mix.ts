
export const stackToCssColorMix = (options: { space?: 'oklch' | 'srgb' } = {}) =>
  (layers: ReadonlyArray<{ color: string; opacity: number }>) =>
    (baseExpr: string): string => {
      const space = options.space || 'oklch'
      let currentExpr = baseExpr

      for (const layer of layers) {
        const pct = Math.round(layer.opacity * 100)
        const remainPct = 100 - pct
        currentExpr = `color-mix(in ${space}, ${currentExpr} ${remainPct}%, ${layer.color} ${pct}%)`
      }

      return currentExpr
    }
