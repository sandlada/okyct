
import type { OKYCT } from '../models/index.ts'
import { isInDisplayP3Gamut } from './is-in-display-p3-gamut.ts'
import { findMaxP3ChromaForTone } from './find-max-p3-chroma-for-tone.ts'

export function okyctToDisplayP3Css(okyct: OKYCT): string {
  const { h, c, t } = okyct
  if (t <= 0.05) return 'color(display-p3 0 0 0)'
  if (t >= 99.95) return 'color(display-p3 1 1 1)'

  const check = isInDisplayP3Gamut(h, c, t)
  if (check.inGamut) {
    return `color(display-p3 ${check.p3Rgb.r.toFixed(4)} ${check.p3Rgb.g.toFixed(4)} ${check.p3Rgb.b.toFixed(4)})`
  }
  const maxP3C = findMaxP3ChromaForTone(h, t)
  const safeP3 = isInDisplayP3Gamut(h, maxP3C, t).p3Rgb
  return `color(display-p3 ${safeP3.r.toFixed(4)} ${safeP3.g.toFixed(4)} ${safeP3.b.toFixed(4)})`
}
