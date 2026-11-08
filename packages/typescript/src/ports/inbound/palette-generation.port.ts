/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer: Inbound Port]
 * 调色板生成与色相和谐驱动端契约 (一个口对应一个文件)
 * 约束：仅依赖 domain/models
 */

export const STANDARD_TONES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100] as const;
export type StandardTone = (typeof STANDARD_TONES)[number];

export type PaletteVariant =
  | 'tonalSpot'    // 经典平衡 MD3，主色聚焦，辅色内敛
  | 'vibrant'      // 高饱和活泼，次色与第三色保有较强色彩张力
  | 'expressive'   // 表现力丰富，色相旋转 60-120 度跳跃
  | 'neutral'      // 低饱和静谧，注重严谨与克制
  | 'monochrome'   // 单色纯粹，去除除灰度与源色外的杂色
  | 'fidelity';    // 原色保真，尽可能保留输入源色的原始色度与明度

export interface ITonalPalettePort {
  readonly hue: number;
  readonly targetChroma: number;
  tone(toneValue: number): string;
  getAllTones(): Record<StandardTone, string>;
}

export const StandardPaletteKeys = [
  'primary',
  'secondary',
  'tertiary',
  'neutral',
  'neutralVariant',
  'error',
  'warning',
  'success',
  'info',
] as const
export type StandardPaletteKey = (typeof StandardPaletteKeys)[number]

export interface PaletteSet<TPalette extends ITonalPalettePort = ITonalPalettePort> {
  primary: TPalette
  secondary: TPalette
  tertiary: TPalette
  neutral: TPalette
  neutralVariant: TPalette
  error: TPalette
  warning: TPalette
  success: TPalette
  info: TPalette
}

export interface IPaletteGenerationPort<TPalette extends ITonalPalettePort = ITonalPalettePort> {
  createPalettesFromSource(
    sourceHex: string,
    variant?: PaletteVariant,
    harmonizeSemantics?: boolean
  ): PaletteSet<TPalette>;
  harmonizeHex(designHex: string, sourceHex: string, maxShiftAngle?: number): string;
  isWarmHue(hue: number): boolean;
}
