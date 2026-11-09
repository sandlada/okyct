
import type { RGB } from '../models/index.ts'

export function hexToRgb(hex: string): RGB {
  let cleaned = hex.replace(/^#/, '').trim()
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(ch => ch + ch).join('')
  }
  if (cleaned.length !== 6) {
    return { r: 0.25, g: 0.4, b: 0.9 }
  }
  const intVal = parseInt(cleaned, 16)
  return {
    r: ((intVal >> 16) & 255) / 255,
    g: ((intVal >> 8) & 255) / 255,
    b: (intVal & 255) / 255,
  }
}
