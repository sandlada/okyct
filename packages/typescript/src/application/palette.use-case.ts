/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer 3: Application Use-Case]
 * 13 级标准色阶、生理色度包络曲线、色相和谐与六大策略变体调色板编排用例
 * 约束：仅依赖 ../domain 与 ../ports（严禁依赖 adapters）
 */

import { hexToOkyct, okyctToHex, findMaxChromaForTone } from '../domain/index.ts';
import {
  STANDARD_TONES,
  StandardPaletteKeys,
  type StandardTone,
  type StandardPaletteKey,
  type PaletteVariant,
  type ITonalPalettePort,
  type PaletteSet as PortPaletteSet,
  type IPaletteGenerationPort,
} from '../ports/inbound/palette-generation.port.ts';

export {
  STANDARD_TONES,
  StandardPaletteKeys,
  type StandardTone,
  type StandardPaletteKey,
  type PaletteVariant,
};

export class TonalPalette implements ITonalPalettePort {
  readonly hue: number;
  readonly targetChroma: number;
  private readonly cache = new Map<number, string>();

  constructor(hue: number, targetChroma: number) {
    this.hue = (hue % 360 + 360) % 360;
    this.targetChroma = Math.max(0, targetChroma);
  }

  /**
   * 从 Hex 种子色直接创建色阶
   */
  static fromHex(hex: string): TonalPalette {
    const okyct = hexToOkyct(hex);
    return new TonalPalette(okyct.h, okyct.c);
  }

  /**
   * 从 H, C 创建指定色相与色度的色阶
   */
  static fromHueAndChroma(hue: number, chroma: number): TonalPalette {
    return new TonalPalette(hue, chroma);
  }

  /**
   * 获取任意 Tone [0-100] 下的十六进制颜色
   */
  tone(toneValue: number): string {
    const t = Math.max(0, Math.min(100, Math.round(toneValue)));
    if (this.cache.has(t)) {
      return this.cache.get(t)!;
    }

    // 采用生理感官平滑包络曲线 (Chroma Envelope)
    // 在极亮 (>90) 与极暗 (<15) 区域自适应衰减色度，避免暗部脏浊与高光过曝刺眼
    let effectiveChroma = this.targetChroma;
    if (t > 90) {
      effectiveChroma *= Math.max(0.2, (100 - t) / 10);
    } else if (t < 15) {
      effectiveChroma *= Math.max(0.3, t / 15);
    }

    // 同时受限于当前色相与 Tone 在 sRGB 内的物理色域上限
    const maxGamutChroma = findMaxChromaForTone(this.hue, t);
    const finalChroma = Math.min(effectiveChroma, maxGamutChroma);

    const colorHex = okyctToHex({
      h: this.hue,
      c: finalChroma,
      t,
    });

    this.cache.set(t, colorHex);
    return colorHex;
  }

  /**
   * 返回所有 13 个标准色阶的 Map
   */
  getAllTones(): Record<StandardTone, string> {
    const result: Partial<Record<StandardTone, string>> = {};
    for (const t of STANDARD_TONES) {
      result[t] = this.tone(t);
    }
    return result as Record<StandardTone, string>;
  }
}

export type PaletteSet = PortPaletteSet<TonalPalette>;

/**
 * 将设计扩展色/语义色向源色主色调平滑靠拢，确保界面整体和谐度
 */
export function harmonizeHex(designHex: string, sourceHex: string, maxShiftAngle = 18): string {
  const design = hexToOkyct(designHex);
  const source = hexToOkyct(sourceHex);

  let diff = (source.h - design.h + 180) % 360 - 180;
  if (diff < -180) diff += 360;

  if (Math.abs(diff) < 120) {
    const shift = Math.sign(diff) * Math.min(Math.abs(diff) * 0.45, maxShiftAngle);
    const newHue = (design.h + shift + 360) % 360;
    return okyctToHex({
      h: newHue,
      c: design.c,
      t: design.t,
    });
  }

  return designHex;
}

/**
 * 判断色相是偏暖还是偏冷
 */
export function isWarmHue(hue: number): boolean {
  return (hue >= 20 && hue <= 110) || hue >= 340;
}

/**
 * 依据输入种子色与指定策略变体，构造完整的八大调色板核心集合
 */
export function createPalettesFromSource(
  sourceHex: string,
  variant: PaletteVariant = 'tonalSpot',
  harmonizeSemantics = true
): PaletteSet {
  const source = hexToOkyct(sourceHex);
  const h = source.h;
  const c = Math.max(0.04, source.c);

  let errorHex = '#BA1A1A';
  let warningHex = '#E69900';
  let successHex = '#1E8E3E';
  let infoHex = '#0288D1';

  if (harmonizeSemantics) {
    errorHex = harmonizeHex(errorHex, sourceHex, 15);
    warningHex = harmonizeHex(warningHex, sourceHex, 18);
    successHex = harmonizeHex(successHex, sourceHex, 18);
    infoHex = harmonizeHex(infoHex, sourceHex, 18);
  }

  const neutralChroma = isWarmHue(h) ? 0.012 : 0.014;
  const neutralVariantChroma = neutralChroma * 2.2;

  switch (variant) {
    case 'vibrant': {
      return {
        primary: new TonalPalette(h, Math.max(0.12, c)),
        secondary: new TonalPalette((h + 25) % 360, Math.max(0.08, c * 0.7)),
        tertiary: new TonalPalette((h + 60) % 360, Math.max(0.1, c * 0.85)),
        neutral: new TonalPalette(h, neutralChroma * 1.5),
        neutralVariant: new TonalPalette(h, neutralVariantChroma * 1.3),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      };
    }

    case 'expressive': {
      return {
        primary: new TonalPalette(h, Math.max(0.1, c)),
        secondary: new TonalPalette((h + 90) % 360, Math.max(0.07, c * 0.65)),
        tertiary: new TonalPalette((h + 180) % 360, Math.max(0.09, c * 0.8)),
        neutral: new TonalPalette((h + 15) % 360, neutralChroma * 1.4),
        neutralVariant: new TonalPalette((h + 15) % 360, neutralVariantChroma * 1.3),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      };
    }

    case 'neutral': {
      return {
        primary: new TonalPalette(h, Math.min(0.08, c * 0.6)),
        secondary: new TonalPalette(h, Math.min(0.04, c * 0.35)),
        tertiary: new TonalPalette((h + 40) % 360, Math.min(0.05, c * 0.45)),
        neutral: new TonalPalette(h, neutralChroma * 0.8),
        neutralVariant: new TonalPalette(h, neutralVariantChroma * 0.8),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      };
    }

    case 'monochrome': {
      return {
        primary: new TonalPalette(h, 0),
        secondary: new TonalPalette(h, 0),
        tertiary: new TonalPalette(h, 0),
        neutral: new TonalPalette(h, 0),
        neutralVariant: new TonalPalette(h, 0),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      };
    }

    case 'fidelity': {
      return {
        primary: new TonalPalette(h, c),
        secondary: new TonalPalette((h + 15) % 360, c * 0.5),
        tertiary: new TonalPalette((h + 30) % 360, c * 0.7),
        neutral: new TonalPalette(h, neutralChroma),
        neutralVariant: new TonalPalette(h, neutralVariantChroma),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      };
    }

    case 'tonalSpot':
    default: {
      return {
        primary: new TonalPalette(h, Math.max(0.09, Math.min(0.18, c))),
        secondary: new TonalPalette((h + 15) % 360, Math.max(0.04, c * 0.45)),
        tertiary: new TonalPalette((h + 60) % 360, Math.max(0.06, c * 0.65)),
        neutral: new TonalPalette(h, neutralChroma),
        neutralVariant: new TonalPalette(h, neutralVariantChroma),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      };
    }
  }
}

export class PaletteGenerationUseCase implements IPaletteGenerationPort<TonalPalette> {
  createPalettesFromSource = createPalettesFromSource;
  harmonizeHex = harmonizeHex;
  isWarmHue = isWarmHue;
}
