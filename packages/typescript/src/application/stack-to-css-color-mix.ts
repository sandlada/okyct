
export const stackToCssColorMix = (options: { space?: 'oklch' | 'srgb' } = {}) =>
  (layers: ReadonlyArray<{ color: string; opacity: number }>) =>
    (baseExpr: string): string => {
      const space = options.space || 'oklch'
      let currentExpr = baseExpr

      for (const layer of layers) {
        const clampedOpacity = Math.max(0, Math.min(1, layer.opacity))
        const pct = Number((clampedOpacity * 100).toFixed(2))
        const remainPct = Number((100 - pct).toFixed(2))
        currentExpr = `color-mix(in ${space}, ${currentExpr} ${remainPct}%, ${layer.color} ${pct}%)`
      }

      return currentExpr
    }
