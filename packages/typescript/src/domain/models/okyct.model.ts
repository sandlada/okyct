/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer: Domain Model]
 * 自研 OKYCT (OKLab Chroma-Hue + CIE Y-Tone) 色彩空间核心坐标模型
 * 约束：零外部依赖
 */

export interface OKYCT {
  h: number; // 色相 Hue: [0, 360)
  c: number; // 色度 Chroma: [0, ~0.4]
  t: number; // 视明度 Tone: [0, 100] (对应 CIE L* / Y 相对亮度)
}
