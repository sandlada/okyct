/**
 * [Hexagonal Layer: Domain Model]
 * Display P3 色域边界检测结果模型
 * 约束：仅依赖同级 domain/models
 */

import type { RGB } from './rgb.model.ts'

export interface P3GamutCheckResult {
  inGamut: boolean
  p3Rgb: RGB
}
