
import type { RGB } from '../../models/index.ts'

export interface P3GamutCheckResult {
  inGamut: boolean
  p3Rgb: RGB
}
