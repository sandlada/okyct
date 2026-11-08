/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer: Domain Service]
 * WCAG 2.1 与 APCA (Lc) 对比度计算及 O(1) 代数解析反演求解器
 * 约束：仅依赖 ../models 与同级纯数学服务
 */

import type { ContrastSolution } from '../models/index.ts';
import { toneToY, yToTone } from './okyct-space.service.ts';

/**
 * 计算两个 Tone 之间的 WCAG 2.1 对比度
 * 纯解析计算，因为 Tone 与相对亮度 Y 直接双射，且不依赖像素色相！
 */
export function getContrastRatio(toneA: number, toneB: number): number {
  const yA = toneToY(toneA);
  const yB = toneToY(toneB);
  const lighter = Math.max(yA, yB);
  const darker = Math.min(yA, yB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 给定背景 Tone 与目标对比度比率 (如 4.5 或 7.0)，
 * 直接通过代数方程反求满足条件的前景 Tone 范围，零遍历损耗！
 */
export function solveTonesForContrast(
  bgTone: number,
  targetRatio: number
): ContrastSolution {
  const bgY = toneToY(bgTone);

  // 1. 尝试找比背景更暗的前景: (bgY + 0.05) / (fgY + 0.05) >= targetRatio
  const darkTargetY = (bgY + 0.05) / targetRatio - 0.05;
  const darkTone = darkTargetY >= 0 ? yToTone(darkTargetY) : null;

  // 2. 尝试找比背景更亮的前景: (fgY + 0.05) / (bgY + 0.05) >= targetRatio
  const lightTargetY = targetRatio * (bgY + 0.05) - 0.05;
  const lightTone = lightTargetY <= 1.0 ? yToTone(lightTargetY) : null;

  return {
    darkForegroundTone: darkTone !== null ? Math.floor(darkTone) : null,
    lightForegroundTone: lightTone !== null ? Math.ceil(lightTone) : null,
  };
}

/**
 * APCA (Advanced Perceptual Contrast Algorithm) Lc 感知对比度值计算
 */
export function getApcaContrast(txtTone: number, bgTone: number): number {
  const txtY = toneToY(txtTone);
  const bgY = toneToY(bgTone);

  const deltaY = txtY - bgY;
  const absDelta = Math.abs(deltaY);
  if (absDelta < 0.0005) return 0;

  let sapc = 0;
  if (bgY > txtY) {
    const yBgExp = Math.pow(bgY, 0.56);
    const yTxtExp = Math.pow(txtY, 0.57);
    sapc = (yBgExp - yTxtExp) * 1.14;
  } else {
    const yBgExp = Math.pow(bgY, 0.65);
    const yTxtExp = Math.pow(txtY, 0.62);
    sapc = (yBgExp - yTxtExp) * 1.14;
  }

  return Math.round(sapc * 100);
}
