/**
 * [Hexagonal Layer: Domain Model]
 * sRGB 色域边界检测结果模型
 * 约束：仅依赖同级 domain/models
 */

import type { RGB } from './rgb.model.ts'

export interface GamutCheckResult {
  inGamut: boolean
  rgb: RGB
}
