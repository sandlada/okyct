/**
 * Color Vision Deficiency (CVD) Simulation
 */

import { hexToRgb, rgbToHex } from '@sandlada/okyct'
import type { CvdType } from './types.ts'

export function simulateCvd(hex: string, type: CvdType): string {
  if (type === 'none') return hex
  const rgb = hexToRgb(hex)

  let r = rgb.r
  let g = rgb.g
  let b = rgb.b

  switch (type) {
    case 'protanopia':
      r = 0.56667 * rgb.r + 0.43333 * rgb.g + 0.0 * rgb.b
      g = 0.55833 * rgb.r + 0.44167 * rgb.g + 0.0 * rgb.b
      b = 0.0 * rgb.r + 0.24167 * rgb.g + 0.75833 * rgb.b
      break
    case 'deuteranopia':
      r = 0.625 * rgb.r + 0.375 * rgb.g + 0.0 * rgb.b
      g = 0.7 * rgb.r + 0.3 * rgb.g + 0.0 * rgb.b
      b = 0.0 * rgb.r + 0.3 * rgb.g + 0.7 * rgb.b
      break
    case 'tritanopia':
      r = 0.95 * rgb.r + 0.05 * rgb.g + 0.0 * rgb.b
      g = 0.0 * rgb.r + 0.43333 * rgb.g + 0.56667 * rgb.b
      b = 0.0 * rgb.r + 0.475 * rgb.g + 0.525 * rgb.b
      break
    case 'achromatopsia': {
      const gray = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
      r = gray
      g = gray
      b = gray
      break
    }
  }

  return rgbToHex({
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, b)),
  })
}
