/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer: Domain Model]
 * OKLab 正交感知空间与 OKLCH 极坐标模型
 * 约束：零外部依赖
 */

export interface OKLab {
  L: number; // [0, 1]
  a: number; // [-0.4, 0.4]
  b: number; // [-0.4, 0.4]
}

export interface OKLCH {
  L: number; // [0, 1]
  C: number; // [0, ~0.4]
  h: number; // [0, 360)
}
