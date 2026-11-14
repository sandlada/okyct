import { parseHexToRgb24, SrgbByteToLinearLut } from './internal/srgb-lut.ts'
import { xyzToOklab } from './internal/xyz-to-oklab.ts'

function rgb24ToOklab(rgb24: number) {
  const rl = SrgbByteToLinearLut[(rgb24 >> 16) & 255]
  const gl = SrgbByteToLinearLut[(rgb24 >> 8) & 255]
  const bl = SrgbByteToLinearLut[rgb24 & 255]
  return xyzToOklab({
    x: 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    y: 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl,
    z: 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl,
  })
}

/**
 * Computes perceptual Euclidean color difference (ΔE_OK) in OKLab space.
 * Returns raw OKLab distance (0 for identical colors, ~1.0 from #000000 to #FFFFFF).
 */
export function getDeltaEOklab(hexA: string, hexB: string): number {
  const rgb24A = parseHexToRgb24(hexA)
  const rgb24B = parseHexToRgb24(hexB)
  if (rgb24A === rgb24B) return 0
  const labA = rgb24ToOklab(rgb24A)
  const labB = rgb24ToOklab(rgb24B)
  return Math.hypot(labB.L - labA.L, labB.a - labA.a, labB.b - labA.b)
}
