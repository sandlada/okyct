/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer: Domain Service]
 * Cusp-Anchored Gamut Mapping (色域尖峰锚定折返裁剪算法) 与 sRGB / Display P3 双色域求解器
 * 约束：仅依赖 ../models 与同级纯数学服务
 */

import type { RGB, OKYCT, GamutCusp, GamutCheckResult, P3GamutCheckResult } from '../models/index.ts';
import {
  toneToY,
  solveOklabLForTargetY,
  oklabToXyz,
  xyzToLinearRgb,
  xyzToLinearP3,
  linearToSrgb,
  rgbToHex,
} from './okyct-space.service.ts';

/**
 * 快速检查 (h, c, t) 对应的颜色是否在 sRGB 色域内
 */
export function isInSrgbGamut(h: number, c: number, t: number): GamutCheckResult {
  if (t <= 0.001) return { inGamut: true, rgb: { r: 0, g: 0, b: 0 } };
  if (t >= 99.999) return { inGamut: true, rgb: { r: 1, g: 1, b: 1 } };

  const targetY = toneToY(t);
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const L = solveOklabLForTargetY(targetY, a, b);
  const xyz = oklabToXyz({ L, a, b });
  const linear = xyzToLinearRgb(xyz);

  const eps = 0.0001;
  const inGamut = (
    linear.r >= -eps && linear.r <= 1.0 + eps &&
    linear.g >= -eps && linear.g <= 1.0 + eps &&
    linear.b >= -eps && linear.b <= 1.0 + eps
  );

  const srgb: RGB = {
    r: linearToSrgb(linear.r),
    g: linearToSrgb(linear.g),
    b: linearToSrgb(linear.b),
  };

  return { inGamut, rgb: srgb };
}

/**
 * 计算指定色相和 Tone 下，sRGB 色域内的最大可达色度 Cmax
 */
export function findMaxChromaForTone(h: number, t: number): number {
  if (t <= 0.5 || t >= 99.5) return 0;

  let low = 0;
  let high = 0.45;
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2;
    if (isInSrgbGamut(h, mid, t).inGamut) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
}

/**
 * 寻找当前色相下的色域尖峰（Cusp: 拥有最大饱和度时的 Tone 与 Chroma）
 */
export function findGamutCusp(h: number): GamutCusp {
  let bestT = 50;
  let maxC = 0;

  for (let t = 20; t <= 90; t += 5) {
    const c = findMaxChromaForTone(h, t);
    if (c > maxC) {
      maxC = c;
      bestT = t;
    }
  }

  const startT = Math.max(10, bestT - 6);
  const endT = Math.min(95, bestT + 6);
  for (let t = startT; t <= endT; t += 1) {
    const c = findMaxChromaForTone(h, t);
    if (c > maxC) {
      maxC = c;
      bestT = t;
    }
  }

  return { tone: bestT, chroma: maxC };
}

/**
 * Cusp-Anchored Gamut Mapping (色域尖峰锚定折返裁剪)
 * 核心设计决策：优先保证 Tone 确定性（UI对比度大局）并锁定色相 H，将超出色域的色度 C 精确截留到色域边界。
 */
export function okyctToRgb(okyct: OKYCT): RGB {
  const { h, c, t } = okyct;

  if (t <= 0.05) return { r: 0, g: 0, b: 0 };
  if (t >= 99.95) return { r: 1, g: 1, b: 1 };

  const check = isInSrgbGamut(h, c, t);
  if (check.inGamut) {
    return {
      r: Math.max(0, Math.min(1, check.rgb.r)),
      g: Math.max(0, Math.min(1, check.rgb.g)),
      b: Math.max(0, Math.min(1, check.rgb.b)),
    };
  }

  const maxC = findMaxChromaForTone(h, t);
  const safeCheck = isInSrgbGamut(h, maxC, t);
  return {
    r: Math.max(0, Math.min(1, safeCheck.rgb.r)),
    g: Math.max(0, Math.min(1, safeCheck.rgb.g)),
    b: Math.max(0, Math.min(1, safeCheck.rgb.b)),
  };
}

export function okyctToHex(okyct: OKYCT): string {
  return rgbToHex(okyctToRgb(okyct));
}

/**
 * 检查 (h, c, t) 是否在 Display P3 广色域内，并返回 P3 空间下的 sRGB 传递函数编码值
 */
export function isInDisplayP3Gamut(h: number, c: number, t: number): P3GamutCheckResult {
  if (t <= 0.001) return { inGamut: true, p3Rgb: { r: 0, g: 0, b: 0 } };
  if (t >= 99.999) return { inGamut: true, p3Rgb: { r: 1, g: 1, b: 1 } };

  const targetY = toneToY(t);
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const L = solveOklabLForTargetY(targetY, a, b);
  const xyz = oklabToXyz({ L, a, b });
  const linearP3 = xyzToLinearP3(xyz);

  const eps = 0.0001;
  const inGamut = (
    linearP3.r >= -eps && linearP3.r <= 1.0 + eps &&
    linearP3.g >= -eps && linearP3.g <= 1.0 + eps &&
    linearP3.b >= -eps && linearP3.b <= 1.0 + eps
  );

  const p3Rgb: RGB = {
    r: Math.max(0, Math.min(1, linearToSrgb(linearP3.r))),
    g: Math.max(0, Math.min(1, linearToSrgb(linearP3.g))),
    b: Math.max(0, Math.min(1, linearToSrgb(linearP3.b))),
  };

  return { inGamut, p3Rgb };
}

/**
 * 计算指定色相和 Tone 下，Display P3 广色域内的最大可达色度 Cmax_P3
 */
export function findMaxP3ChromaForTone(h: number, t: number): number {
  if (t <= 0.5 || t >= 99.5) return 0;

  let low = 0;
  let high = 0.5;
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2;
    if (isInDisplayP3Gamut(h, mid, t).inGamut) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
}

/**
 * 寻找当前色相下在 Display P3 广色域中的尖峰 (P3 Cusp)
 */
export function findP3GamutCusp(h: number): GamutCusp {
  let bestT = 50;
  let maxC = 0;
  for (let t = 20; t <= 90; t += 5) {
    const c = findMaxP3ChromaForTone(h, t);
    if (c > maxC) {
      maxC = c;
      bestT = t;
    }
  }
  const startT = Math.max(10, bestT - 6);
  const endT = Math.min(95, bestT + 6);
  for (let t = startT; t <= endT; t += 1) {
    const c = findMaxP3ChromaForTone(h, t);
    if (c > maxC) {
      maxC = c;
      bestT = t;
    }
  }
  return { tone: bestT, chroma: maxC };
}

/**
 * 将 OKYCT 坐标格式化为现代 CSS color(display-p3 r g b) 字符串（带 P3 色域边界折返）
 */
export function okyctToDisplayP3Css(okyct: OKYCT): string {
  const { h, c, t } = okyct;
  if (t <= 0.05) return 'color(display-p3 0 0 0)';
  if (t >= 99.95) return 'color(display-p3 1 1 1)';

  const check = isInDisplayP3Gamut(h, c, t);
  if (check.inGamut) {
    return `color(display-p3 ${check.p3Rgb.r.toFixed(4)} ${check.p3Rgb.g.toFixed(4)} ${check.p3Rgb.b.toFixed(4)})`;
  }
  const maxP3C = findMaxP3ChromaForTone(h, t);
  const safeP3 = isInDisplayP3Gamut(h, maxP3C, t).p3Rgb;
  return `color(display-p3 ${safeP3.r.toFixed(4)} ${safeP3.g.toFixed(4)} ${safeP3.b.toFixed(4)})`;
}
