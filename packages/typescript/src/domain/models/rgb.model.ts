/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer: Domain Model]
 * RGB 与 CIE 1931 XYZ (D65) 基础三刺激值模型
 * 约束：零外部依赖
 */

export interface RGB {
  r: number; // [0, 1]
  g: number; // [0, 1]
  b: number; // [0, 1]
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}
