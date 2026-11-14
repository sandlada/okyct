
import type { RGB } from '../models/index.ts'
import { parseHexToRgb24, SrgbByteToUnitLut } from './internal/srgb-lut.ts'

export function hexToRgb(hex: string): RGB {
  const rgb24 = parseHexToRgb24(hex)
  return {
    r: SrgbByteToUnitLut[(rgb24 >> 16) & 255],
    g: SrgbByteToUnitLut[(rgb24 >> 8) & 255],
    b: SrgbByteToUnitLut[rgb24 & 255],
  }
}
