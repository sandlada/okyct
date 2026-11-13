import type { GamutMappingMode, OKYCT } from '../models/index.ts'
import { okyctToRgb } from './okyct-to-rgb.ts'

export function okyctToDisplayP3Css(
  okyct: OKYCT,
  options: { gamutMapping?: GamutMappingMode } = {}
): string {
  const p3 = okyctToRgb(okyct, {
    gamut: 'display-p3',
    gamutMapping: options.gamutMapping ?? 'preserve-tone',
  })
  return `color(display-p3 ${p3.r.toFixed(4)} ${p3.g.toFixed(4)} ${p3.b.toFixed(4)})`
}
