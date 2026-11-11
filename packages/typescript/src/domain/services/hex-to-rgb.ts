
import type { RGB } from '../models/index.ts'

export function hexToRgb(hex: string): RGB {
  if (typeof hex !== 'string') {
    throw new Error(`Invalid hex color input: expected string, received ${typeof hex}`)
  }

  let cleaned = hex.trim().replace(/^#/, '')
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((ch) => ch + ch).join('')
  }

  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    throw new Error(`Invalid hex color format: "${hex}". Expected #RGB or #RRGGBB hexadecimal string.`)
  }

  const intVal = parseInt(cleaned, 16)
  return {
    r: ((intVal >> 16) & 255) / 255,
    g: ((intVal >> 8) & 255) / 255,
    b: (intVal & 255) / 255,
  }
}
