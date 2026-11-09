
import type { RGB, OKYCT } from '../models/index.ts'
import { srgbToLinear } from './srgb-to-linear.ts'
import { linearRgbToXyz } from './linear-rgb-to-xyz.ts'
import { xyzToOklab } from './xyz-to-oklab.ts'
import { yToTone } from './y-to-tone.ts'

export function rgbToOkyct(rgb: RGB): OKYCT {
  const linear = {
    r: srgbToLinear(rgb.r),
    g: srgbToLinear(rgb.g),
    b: srgbToLinear(rgb.b),
  }
  const xyz = linearRgbToXyz(linear)
  const oklab = xyzToOklab(xyz)

  let h = (Math.atan2(oklab.b, oklab.a) * 180) / Math.PI
  if (h < 0) h += 360

  const c = Math.hypot(oklab.a, oklab.b)
  const t = yToTone(xyz.y)

  return { h, c, t }
}
