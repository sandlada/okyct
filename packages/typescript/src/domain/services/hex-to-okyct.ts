
import type { OKYCT } from '../models/index.ts'
import { linearRgbToXyz } from './internal/linear-rgb-to-xyz.ts'
import { parseHexToRgb24, SrgbByteToLinearLut } from './internal/srgb-lut.ts'
import { xyzToOklab } from './internal/xyz-to-oklab.ts'
import { yToTone } from './y-to-tone.ts'

const RadToDeg = 180 / Math.PI

export function hexToOkyct(hex: string): OKYCT {
  const rgb24 = parseHexToRgb24(hex)
  const r8 = (rgb24 >> 16) & 255
  const g8 = (rgb24 >> 8) & 255
  const b8 = rgb24 & 255

  if (r8 === g8 && g8 === b8) {
    return {
      h: 0,
      c: 0,
      t: yToTone(SrgbByteToLinearLut[r8]),
    }
  }

  const xyz = linearRgbToXyz({
    r: SrgbByteToLinearLut[r8],
    g: SrgbByteToLinearLut[g8],
    b: SrgbByteToLinearLut[b8],
  })
  const oklab = xyzToOklab(xyz)

  const c = Math.hypot(oklab.a, oklab.b)
  const t = yToTone(xyz.y)
  if (c < 1e-7) {
    return { h: 0, c: 0, t }
  }

  let h = Math.atan2(oklab.b, oklab.a) * RadToDeg
  if (h < 0) h += 360

  return { h, c, t }
}
