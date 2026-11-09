
import type { OKYCT } from '../models/index.ts'
import { okyctToRgb } from './okyct-to-rgb.ts'
import { rgbToHex } from './rgb-to-hex.ts'

export function okyctToHex(okyct: OKYCT): string {
  return rgbToHex(okyctToRgb(okyct))
}
