
import type { RGB } from '../models/index.ts'

export function rgbToHex(rgb: RGB): string {
  if (
    rgb === null ||
    typeof rgb !== 'object' ||
    !Number.isFinite(rgb.r) ||
    !Number.isFinite(rgb.g) ||
    !Number.isFinite(rgb.b)
  ) {
    throw new Error('Invalid RGB input: expected an object with finite numeric r, g, and b fields.')
  }
  const rClamped = Math.max(0, Math.min(255, Math.round(rgb.r * 255)))
  const gClamped = Math.max(0, Math.min(255, Math.round(rgb.g * 255)))
  const bClamped = Math.max(0, Math.min(255, Math.round(rgb.b * 255)))
  return '#' + [rClamped, gClamped, bClamped].map(x => x.toString(16).padStart(2, '0')).join('')
}
