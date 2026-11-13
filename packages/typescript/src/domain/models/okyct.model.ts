/**
 * [Hexagonal Layer: Domain Model]
 * 自研 OKYCT (OKLab Chroma-Hue + CIE Y-Tone) 色彩空间核心坐标模型
 * 约束：零外部依赖
 */

export interface OKYCT {
  h: number
  c: number
  t: number
}

export type ColorToneInput = number | string | OKYCT
