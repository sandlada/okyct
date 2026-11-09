
import type { RGB, XYZ } from '../models/index.ts'

export function linearRgbToXyz(rgb: RGB): XYZ {
  return {
    x: 0.4124564 * rgb.r + 0.3575761 * rgb.g + 0.1804375 * rgb.b,
    y: 0.2126729 * rgb.r + 0.7151522 * rgb.g + 0.0721750 * rgb.b,
    z: 0.0193339 * rgb.r + 0.1191920 * rgb.g + 0.9503041 * rgb.b,
  }
}
