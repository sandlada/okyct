
import type { RGB, OKYCT } from '../models/index.ts'
import { srgbToLinear } from './srgb-to-linear.ts'
import { yToTone } from './y-to-tone.ts'

const RadToDeg = 180 / Math.PI

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

  const rl = srgbToLinear(rgb.r)
  const gl = srgbToLinear(rgb.g)
  const bl = srgbToLinear(rgb.b)

  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl
  const z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl

  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)

  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

  const c = Math.hypot(a, b)
  const t = yToTone(y)
  if (c < 1e-7) {
    return { h: 0, c: 0, t }
  }

  let h = Math.atan2(b, a) * RadToDeg
  if (h < 0) h += 360

  return { h, c, t }
}
