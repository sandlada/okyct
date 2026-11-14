import { hexToRgb } from './hex-to-rgb.ts'
import { linearRgbToXyz } from './internal/linear-rgb-to-xyz.ts'
import { xyzToOklab } from './internal/xyz-to-oklab.ts'
import { srgbToLinear } from './srgb-to-linear.ts'

function hexToOklab(hex: string) {
  const rgb = hexToRgb(hex)
  return xyzToOklab(
    linearRgbToXyz({
      r: srgbToLinear(rgb.r),
      g: srgbToLinear(rgb.g),
      b: srgbToLinear(rgb.b),
    }),
  )
}

/**
 * Computes perceptual Euclidean color difference (ΔE_OK) in OKLab space.
 * Returns raw OKLab distance (0 for identical colors, ~1.0 from #000000 to #FFFFFF).
 */
export function getDeltaEOklab(hexA: string, hexB: string): number {
  const labA = hexToOklab(hexA)
  const labB = hexToOklab(hexB)
  return Math.hypot(labB.L - labA.L, labB.a - labA.a, labB.b - labA.b)
}
