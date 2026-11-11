/**
 * [Hexagonal Layer: Domain Model]
 * 色域尖峰 (Gamut Cusp) 模型
 * 约束：零外部依赖
 */

export interface GamutCusp {
  tone: number
  chroma: number
}
