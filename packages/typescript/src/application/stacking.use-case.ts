/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer 3: Application Use-Case]
 * N 层含透明度颜色叠加、交互状态层合成与叠加态对比度守卫用例
 * 约束：仅依赖 ../domain 与 ../ports（严禁依赖 adapters）
 */

import {
  hexToRgb,
  rgbToHex,
  srgbToLinear,
  linearToSrgb,
  rgbToOkyct,
  okyctToRgb,
  getContrastRatio,
  getApcaContrast,
  solveTonesForContrast,
  type RGB,
} from '../domain/index.ts';
import type {
  ColorLayer,
  LayerStepTrace,
  CompositedResult,
  StackOptions,
  StackedContrastReport,
  ILayerStackingPort,
} from '../ports/inbound/layer-stacking.port.ts';

export type {
  ColorLayer,
  LayerStepTrace,
  CompositedResult,
  StackOptions,
  StackedContrastReport,
};

function blendTwoColors(
  fgColor: string,
  fgAlpha: number,
  bgColor: string,
  bgAlpha = 1.0,
  blendSpace: 'linear-srgb' | 'gamma-srgb' | 'okyct' = 'linear-srgb'
): { hex: string; alpha: number } {
  const fgRgb = hexToRgb(fgColor);
  const bgRgb = hexToRgb(bgColor);

  const a_fg = Math.max(0, Math.min(1, fgAlpha));
  const a_bg = Math.max(0, Math.min(1, bgAlpha));

  const a_out = a_fg + a_bg * (1 - a_fg);
  if (a_out <= 0) return { hex: '#000000', alpha: 0 };

  const wFg = a_fg / a_out;
  const wBg = (a_bg * (1 - a_fg)) / a_out;

  if (blendSpace === 'okyct') {
    const fgOkyct = rgbToOkyct(fgRgb);
    const bgOkyct = rgbToOkyct(bgRgb);

    const fgRad = (fgOkyct.h * Math.PI) / 180;
    const bgRad = (bgOkyct.h * Math.PI) / 180;

    const aMix = fgOkyct.c * Math.cos(fgRad) * wFg + bgOkyct.c * Math.cos(bgRad) * wBg;
    const bMix = fgOkyct.c * Math.sin(fgRad) * wFg + bgOkyct.c * Math.sin(bgRad) * wBg;

    let hOut = (Math.atan2(bMix, aMix) * 180) / Math.PI;
    if (hOut < 0) hOut += 360;

    const vectorChroma = Math.hypot(aMix, bMix);
    const scalarChroma = fgOkyct.c * wFg + bgOkyct.c * wBg;
    const cOut = vectorChroma * 0.7 + scalarChroma * 0.3;

    const tOut = fgOkyct.t * wFg + bgOkyct.t * wBg;

    const outRgb = okyctToRgb({ h: hOut, c: cOut, t: tOut });
    return { hex: rgbToHex(outRgb), alpha: a_out };
  }

  let r_out = 0;
  let g_out = 0;
  let b_out = 0;

  if (blendSpace === 'linear-srgb') {
    const fgLin = { r: srgbToLinear(fgRgb.r), g: srgbToLinear(fgRgb.g), b: srgbToLinear(fgRgb.b) };
    const bgLin = { r: srgbToLinear(bgRgb.r), g: srgbToLinear(bgRgb.g), b: srgbToLinear(bgRgb.b) };

    const r_lin = fgLin.r * wFg + bgLin.r * wBg;
    const g_lin = fgLin.g * wFg + bgLin.g * wBg;
    const b_lin = fgLin.b * wFg + bgLin.b * wBg;

    r_out = linearToSrgb(r_lin);
    g_out = linearToSrgb(g_lin);
    b_out = linearToSrgb(b_lin);
  } else {
    r_out = fgRgb.r * wFg + bgRgb.r * wBg;
    g_out = fgRgb.g * wFg + bgRgb.g * wBg;
    b_out = fgRgb.b * wFg + bgRgb.b * wBg;
  }

  const outRgb: RGB = {
    r: Math.max(0, Math.min(1, r_out)),
    g: Math.max(0, Math.min(1, g_out)),
    b: Math.max(0, Math.min(1, b_out)),
  };

  return { hex: rgbToHex(outRgb), alpha: a_out };
}

/**
 * 任意 N 层含透明度颜色叠加合成算子
 * 严格柯里化参数后置：stackLayers(options)(layers)(baseColor)
 */
export const stackLayers = (options: StackOptions = {}) =>
  (layers: readonly ColorLayer[]) =>
    (baseColor: string): CompositedResult => {
      const blendSpace = options.blendSpace || 'linear-srgb';
      const traces: LayerStepTrace[] = [];

      let currentHex = baseColor;
      let currentOkyct = rgbToOkyct(hexToRgb(currentHex));

      traces.push({
        stepIndex: 0,
        label: 'Base 底层',
        layerColor: baseColor,
        layerOpacity: 1.0,
        accumulatedHex: currentHex,
        accumulatedOkyct: currentOkyct,
        wcagContrastWithWhite: getContrastRatio(currentOkyct.t, 100),
        wcagContrastWithBlack: getContrastRatio(currentOkyct.t, 0),
      });

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const blended = blendTwoColors(layer.color, layer.opacity, currentHex, 1.0, blendSpace);
        currentHex = blended.hex;
        currentOkyct = rgbToOkyct(hexToRgb(currentHex));

        traces.push({
          stepIndex: i + 1,
          label: layer.label || `Layer ${i + 1}`,
          layerColor: layer.color,
          layerOpacity: layer.opacity,
          accumulatedHex: currentHex,
          accumulatedOkyct: currentOkyct,
          wcagContrastWithWhite: getContrastRatio(currentOkyct.t, 100),
          wcagContrastWithBlack: getContrastRatio(currentOkyct.t, 0),
        });
      }

      return {
        baseColor,
        totalLayers: layers.length,
        finalHex: currentHex,
        finalOkyct: currentOkyct,
        traces,
        blendSpace,
      };
    };

/**
 * MD3 标准交互状态层自动合成算子 (Hover, Focus, Pressed, Dragged)
 * 严格柯里化参数后置：stackStateLayers(states)(pair)
 */
export const stackStateLayers = (states: Array<'hover' | 'focus' | 'pressed' | 'dragged'>) =>
  (pair: { base: string; stateColor: string }): CompositedResult => {
    const opacityMap: Record<string, number> = {
      hover: 0.08,
      focus: 0.12,
      pressed: 0.12,
      dragged: 0.16,
    };

    const layers: ColorLayer[] = states.map(s => ({
      color: pair.stateColor,
      opacity: opacityMap[s] ?? 0.08,
      label: `${s.toUpperCase()} 状态层 (${Math.round((opacityMap[s] ?? 0.08) * 100)}%)`,
    }));

    return stackLayers({ blendSpace: 'linear-srgb' })(layers)(pair.base);
  };

/**
 * 审计 N 层叠加后，前景文字与最终背景之间的对比度安全性
 * 严格柯里化参数后置：auditStackedContrast(foregroundHex)(compositedResult)
 */
export const auditStackedContrast = (foregroundHex: string) =>
  (composited: CompositedResult): StackedContrastReport => {
    const fgOkyct = rgbToOkyct(hexToRgb(foregroundHex));
    const bgOkyct = composited.finalOkyct;
    const baseOkyct = composited.traces[0]?.accumulatedOkyct ?? bgOkyct;

    const wcagRatio = getContrastRatio(fgOkyct.t, bgOkyct.t);
    const apcaLc = Math.abs(getApcaContrast(fgOkyct.t, bgOkyct.t));
    const deltaTone = bgOkyct.t - baseOkyct.t;

    const wcagPassAA = wcagRatio >= 4.5;
    const wcagPassAAA = wcagRatio >= 7.0;

    let warningMessage: string | undefined;
    let recommendedCompensationTone: number | null = null;

    if (!wcagPassAA) {
      warningMessage = `警告：在 ${composited.totalLayers} 层叠加后，背景 Tone 产生 ΔT=${deltaTone > 0 ? '+' : ''}${deltaTone.toFixed(1)} 偏移，导致对比度跌至 ${wcagRatio.toFixed(2)}:1 (低于 WCAG AA 4.5:1)。`;
      const solved = solveTonesForContrast(bgOkyct.t, 4.5);
      recommendedCompensationTone = fgOkyct.t > bgOkyct.t ? solved.lightForegroundTone : solved.darkForegroundTone;
    }

    return {
      foregroundHex,
      finalBackgroundHex: composited.finalHex,
      wcagRatio: parseFloat(wcagRatio.toFixed(2)),
      wcagPassAA,
      wcagPassAAA,
      apcaLc,
      deltaToneFromBase: parseFloat(deltaTone.toFixed(1)),
      warningMessage,
      recommendedCompensationTone,
    };
  };

/**
 * 将 N 层叠加递归折叠为现代 CSS color-mix() 嵌套链式表达式
 * 严格柯里化参数后置：stackToCssColorMix(options)(layers)(baseExpr)
 */
export const stackToCssColorMix = (options: { space?: 'oklch' | 'srgb' } = {}) =>
  (layers: ReadonlyArray<{ color: string; opacity: number }>) =>
    (baseExpr: string): string => {
      const space = options.space || 'oklch';
      let currentExpr = baseExpr;

      for (const layer of layers) {
        const pct = Math.round(layer.opacity * 100);
        const remainPct = 100 - pct;
        currentExpr = `color-mix(in ${space}, ${currentExpr} ${remainPct}%, ${layer.color} ${pct}%)`;
      }

      return currentExpr;
    };

export class LayerStackingUseCase implements ILayerStackingPort {
  stackLayers = stackLayers;
  stackStateLayers = stackStateLayers;
  auditStackedContrast = auditStackedContrast;
  stackToCssColorMix = stackToCssColorMix;
}
