import type { RGB } from '../../models/index.ts'
import type { XYZ } from './xyz.model.ts'

export function linearP3ToXyz(rgb: RGB): XYZ {
  return {
    x: 0.4865710 * rgb.r + 0.2656677 * rgb.g + 0.1982173 * rgb.b,
    y: 0.2289746 * rgb.r + 0.6917385 * rgb.g + 0.0792869 * rgb.b,
    z: 0.0451134 * rgb.g + 1.0439444 * rgb.b,
  }
}
