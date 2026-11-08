/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer: Domain Service]
 * OKYCT 正逆向空间转换、CIE Y <-> Tone 解析双射与单变量牛顿切线求解器
 * 约束：仅依赖 ../models
 */

import type { RGB, XYZ, OKLab, OKYCT } from '../models/index.ts';

// sRGB Gamma 压缩与解压缩
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;
}

// 颜色字符串与基础 RGB 互转
export function hexToRgb(hex: string): RGB {
  let cleaned = hex.replace(/^#/, '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(ch => ch + ch).join('');
  }
  if (cleaned.length !== 6) {
    return { r: 0.25, g: 0.4, b: 0.9 }; // 默认稳健回退
  }
  const intVal = parseInt(cleaned, 16);
  return {
    r: ((intVal >> 16) & 255) / 255,
    g: ((intVal >> 8) & 255) / 255,
    b: (intVal & 255) / 255,
  };
}

export function rgbToHex(rgb: RGB): string {
  const rClamped = Math.max(0, Math.min(255, Math.round(rgb.r * 255)));
  const gClamped = Math.max(0, Math.min(255, Math.round(rgb.g * 255)));
  const bClamped = Math.max(0, Math.min(255, Math.round(rgb.b * 255)));
  return '#' + [rClamped, gClamped, bClamped].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Linear sRGB <-> CIE XYZ (D65 标定)
export function linearRgbToXyz(rgb: RGB): XYZ {
  return {
    x: 0.4124564 * rgb.r + 0.3575761 * rgb.g + 0.1804375 * rgb.b,
    y: 0.2126729 * rgb.r + 0.7151522 * rgb.g + 0.0721750 * rgb.b,
    z: 0.0193339 * rgb.r + 0.1191920 * rgb.g + 0.9503041 * rgb.b,
  };
}

export function xyzToLinearRgb(xyz: XYZ): RGB {
  return {
    r:  3.2404542 * xyz.x - 1.5371385 * xyz.y - 0.4985314 * xyz.z,
    g: -0.9692660 * xyz.x + 1.8760108 * xyz.y + 0.0415560 * xyz.z,
    b:  0.0556434 * xyz.x - 0.2040259 * xyz.y + 1.0572252 * xyz.z,
  };
}

// CIE XYZ (D65) -> Linear Display P3 转换矩阵
export function xyzToLinearP3(xyz: XYZ): RGB {
  return {
    r:  2.4934969 * xyz.x - 0.9313836 * xyz.y - 0.4027108 * xyz.z,
    g: -0.8294890 * xyz.x + 1.7626641 * xyz.y + 0.0236247 * xyz.z,
    b:  0.0358458 * xyz.x - 0.0761724 * xyz.y + 0.9568845 * xyz.z,
  };
}

// CIE XYZ (D65) <-> OKLab
export function xyzToOklab(xyz: XYZ): OKLab {
  // M1 矩阵变换到 LMS 视锥细胞刺激空间
  const l = 0.8189330101 * xyz.x + 0.3618667424 * xyz.y - 0.1288597137 * xyz.z;
  const m = 0.0329845436 * xyz.x + 0.9293118715 * xyz.y + 0.0361456387 * xyz.z;
  const s = 0.0482003018 * xyz.x + 0.2643662691 * xyz.y + 0.6338517070 * xyz.z;

  const l_ = Math.cbrt(Math.max(0, l));
  const m_ = Math.cbrt(Math.max(0, m));
  const s_ = Math.cbrt(Math.max(0, s));

  // M2 矩阵变换到对立感知空间 (L, a, b)
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

export function oklabToXyz(lab: OKLab): XYZ {
  // M2 逆变换
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.2914855480 * lab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // M1 逆变换
  return {
    x:  1.2270138511 * l - 0.5577999807 * m + 0.2812561490 * s,
    y: -0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s,
    z: -0.0763812845 * l - 0.4214819784 * m + 1.5861632204 * s,
  };
}

// CIE 相对亮度 Y 与视明度 Tone (0-100) 双射解析关系
export function toneToY(tone: number): number {
  const t = Math.max(0, Math.min(100, tone));
  if (t <= 8.0) {
    return (t / 903.2962962) / 1.0;
  }
  const yRoot = (t + 16.0) / 116.0;
  return yRoot * yRoot * yRoot;
}

export function yToTone(y: number): number {
  const yClamped = Math.max(0, y);
  const eps = 216.0 / 24389.0; // ~0.008856
  const kappa = 24389.0 / 27.0; // ~903.3
  if (yClamped <= eps) {
    return yClamped * kappa;
  }
  return 116.0 * Math.cbrt(yClamped) - 16.0;
}

/**
 * 将 sRGB 转为自研 OKYCT 坐标
 */
export function rgbToOkyct(rgb: RGB): OKYCT {
  const linear = {
    r: srgbToLinear(rgb.r),
    g: srgbToLinear(rgb.g),
    b: srgbToLinear(rgb.b),
  };
  const xyz = linearRgbToXyz(linear);
  const oklab = xyzToOklab(xyz);

  // 1. 色相 Hue: 由 OKLab 平面的 (a, b) 极角决定，极佳的色相线性度
  let h = (Math.atan2(oklab.b, oklab.a) * 180) / Math.PI;
  if (h < 0) h += 360;

  // 2. 色度 Chroma: 极坐标模长
  const c = Math.hypot(oklab.a, oklab.b);

  // 3. 视明度 Tone: 直接锚定 CIE 相对亮度 Y，具备严格的 WCAG 对比度保证
  const t = yToTone(xyz.y);

  return { h, c, t };
}

export function hexToOkyct(hex: string): OKYCT {
  return rgbToOkyct(hexToRgb(hex));
}

/**
 * 给定固定的 (a, b)，由于 Y(L) = -0.04058*l^3 + 1.11225*m^3 - 0.07167*s^3 是 L 的单调严格递增函数，
 * 采用牛顿切线法高精度求出满足目标相对亮度 targetY 的 OKLab L 值。
 */
export function solveOklabLForTargetY(targetY: number, a: number, b: number): number {
  if (targetY <= 0) return 0;
  if (targetY >= 1.0) return 1.0;

  let L = Math.cbrt(targetY);

  for (let i = 0; i < 7; i++) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;

    const currentY = -0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3;
    const diff = currentY - targetY;
    if (Math.abs(diff) < 1e-6) break;

    const dl3_dL = 3 * l_ * l_;
    const dm3_dL = 3 * m_ * m_;
    const ds3_dL = 3 * s_ * s_;
    const dY_dL = -0.0405801784 * dl3_dL + 1.1122568696 * dm3_dL - 0.0716766787 * ds3_dL;

    if (Math.abs(dY_dL) < 1e-8) break;
    L = L - diff / dY_dL;
    L = Math.max(0, Math.min(1.0, L));
  }

  return L;
}
