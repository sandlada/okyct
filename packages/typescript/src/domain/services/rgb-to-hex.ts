
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
  const r = rgb.r <= 0 ? 0 : rgb.r >= 1 ? 255 : (rgb.r * 255 + 0.5) | 0
  const g = rgb.g <= 0 ? 0 : rgb.g >= 1 ? 255 : (rgb.g * 255 + 0.5) | 0
  const b = rgb.b <= 0 ? 0 : rgb.b >= 1 ? 255 : (rgb.b * 255 + 0.5) | 0
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}
