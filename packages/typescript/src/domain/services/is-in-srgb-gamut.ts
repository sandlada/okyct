import type { GamutCheckResult, OKYCT } from '../models/index.ts'
import { isInGamut } from './is-in-gamut.ts'

export function isInSrgbGamut(color: OKYCT): GamutCheckResult
export function isInSrgbGamut(h: number, c: number, t: number): GamutCheckResult
export function isInSrgbGamut(hOrColor: number | OKYCT, c?: number, t?: number): GamutCheckResult {
  const color: OKYCT =
    typeof hOrColor === 'number'
      ? { h: hOrColor, c: c ?? NaN, t: t ?? NaN }
      : hOrColor
  return isInGamut(color, { gamut: 'srgb' })
}
