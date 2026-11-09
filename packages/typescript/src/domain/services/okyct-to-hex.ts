
import type { OKYCT } from '../models/index.ts'
import { okyctToRgb } from './okyct-to-rgb.ts'
import { snapRgbToHexForHuePreserve } from './internal/snap-rgb-for-hue-preserve.ts'

export function okyctToHex(okyct: OKYCT): string {
  const rgb = okyctToRgb(okyct)
  return snapRgbToHexForHuePreserve(rgb, okyct.h, okyct.t)
}
