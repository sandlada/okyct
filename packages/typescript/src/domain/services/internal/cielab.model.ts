/**
 * [Hexagonal Layer: Domain Model]
 * CIE 1976 L*a*b* (D65) 内部模型
 * 约束：零外部依赖
 */

export interface CIELAB {
  readonly l: number
  readonly a: number
  readonly b: number
}
