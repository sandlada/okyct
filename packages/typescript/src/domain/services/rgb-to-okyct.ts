
import type { RGB, OKYCT } from '../models/index.ts'
import { srgbToLinear } from './srgb-to-linear.ts'
import { linearRgbToXyz } from './internal/linear-rgb-to-xyz.ts'
import { xyzToOklab } from './internal/xyz-to-oklab.ts'
import { yToTone } from './y-to-tone.ts'

export function rgbToOkyct(rgb: RGB): OKYCT {
  if (
    rgb === null ||
    typeof rgb !== 'object' ||
    !Number.isFinite(rgb.r) ||
    !Number.isFinite(rgb.g) ||
    !Number.isFinite(rgb.b)
  ) {
    throw new Error('Invalid RGB input: expected an object with finite numeric r, g, and b fields.')
  }
  if (rgb.r === rgb.g && rgb.g === rgb.b) {
    return {
      h: 0,
      c: 0,
      t: yToTone(srgbToLinear(rgb.r)),
    }
  }
  const linear = {
    r: srgbToLinear(rgb.r),
    g: srgbToLinear(rgb.g),
    b: srgbToLinear(rgb.b),
  }
  const xyz = linearRgbToXyz(linear)
  const oklab = xyzToOklab(xyz)

  const c = Math.hypot(oklab.a, oklab.b)
  const t = yToTone(xyz.y)
  if (c < 1e-7) {
    return { h: 0, c: 0, t }
  }

  let h = (Math.atan2(oklab.b, oklab.a) * 180) / Math.PI
  if (h < 0) h += 360

  return { h, c, t }
}
