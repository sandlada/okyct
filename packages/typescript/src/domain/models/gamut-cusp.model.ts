/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer: Domain Model]
 * 色域尖峰 (Gamut Cusp) 与 sRGB / Display P3 色域边界检测结果模型
 * 约束：仅依赖同级 domain/models
 */

import type { RGB } from './rgb.model.ts';

export interface GamutCusp {
  tone: number;
  chroma: number;
}

export interface GamutCheckResult {
  inGamut: boolean;
  rgb: RGB;
}

export interface P3GamutCheckResult {
  inGamut: boolean;
  p3Rgb: RGB;
}
