import type { ColorConversionOptions, OKYCT } from '../models/index.ts'
import { okyctToRgb } from './okyct-to-rgb.ts'
import { rgbToOkyct } from './rgb-to-okyct.ts'
import { snapRgbToHexForHuePreserve } from './internal/snap-rgb-for-hue-preserve.ts'

export function okyctToHex(okyct: OKYCT, options: ColorConversionOptions = {}): string {
  const rgb = okyctToRgb(okyct, options)
  if (options.gamut === 'display-p3') {
    throw new Error(
      'okyctToHex produces 8-bit sRGB hex strings; use okyctToDisplayP3Css for Display P3 output.'
    )
  }
  if (okyct.t <= 0.001) return '#000000'
  if (okyct.t >= 99.999) return '#ffffff'
  if (options.gamutMapping === 'cusp-compress') {
    const mapped = rgbToOkyct(rgb)
    return snapRgbToHexForHuePreserve(rgb, okyct.h, mapped.t, mapped.c)
  }
  return snapRgbToHexForHuePreserve(rgb, okyct.h, okyct.t, okyct.c)
}
