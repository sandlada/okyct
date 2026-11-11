/**
 * 落地页配色推导。全部颜色经由 @sandlada/okyct 门面生成，
 * 页面本身不硬编码任何品牌色值（种子选择器除外）。
 */

import {
  createPalettesFromSource,
  StandardTones,
  type StandardTone,
} from '../../color/palettes.ts'
import { findMaxChromaForTone, hexToOkyct, okyctToHex } from '../../color/math.ts'
import { buildDynamicScheme, type DynamicSchemeColors } from '../../color/scheme.ts'
import type { MessageKey } from '../../i18n/messages/en.ts'

export const LandingSeeds = [
  { id: 'azure', hex: '#1A73E8' },
  { id: 'violet', hex: '#7C4DFF' },
  { id: 'ember', hex: '#FF5A3C' },
  { id: 'jade', hex: '#00A87E' },
  { id: 'amber', hex: '#FFB300' },
] as const

export const DefaultLandingSeed: string = LandingSeeds[0].hex

export const LandingToneRowKeys = [
  'primary',
  'secondary',
  'tertiary',
  'neutral',
  'neutralVariant',
] as const

export type LandingToneRowKey = (typeof LandingToneRowKeys)[number]

export const LandingToneRowLabels: Record<LandingToneRowKey, MessageKey> = {
  primary: 'palette.palettes.primary',
  secondary: 'palette.palettes.secondary',
  tertiary: 'palette.palettes.tertiary',
  neutral: 'palette.palettes.neutral',
  neutralVariant: 'palette.palettes.neutralVariant',
}

export interface ToneSwatch {
  readonly tone: StandardTone
  readonly hex: string
}

export interface LandingPaletteRow {
  readonly key: LandingToneRowKey
  readonly labelKey: MessageKey
  readonly swatches: readonly ToneSwatch[]
}

export interface SpectrumStop {
  readonly hue: number
  readonly hex: string
}

export interface LandingSchemes {
  readonly light: DynamicSchemeColors
  readonly dark: DynamicSchemeColors
}

export interface LandingPalette {
  readonly seedHex: string
  readonly rows: readonly LandingPaletteRow[]
  readonly schemes: LandingSchemes
  readonly accents: {
    readonly primary: string
    readonly secondary: string
    readonly tertiary: string
    readonly neutral: string
  }
  readonly ringColors: readonly string[]
  readonly ringStops: readonly SpectrumStop[]
}

/**
 * 首屏光谱环：绕种子色相完整旋转一圈的 conic-gradient 停靠色。
 * 每个停靠点保留色相角度，供检查器卡片定位指示点与 tooltip 使用。
 */
export function buildSpectrumStops(seedHex: string): readonly SpectrumStop[] {
  const base = hexToOkyct(seedHex)
  const Stops = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]
  return Stops.map((offset) => {
    const hue = (base.h + offset) % 360
    const chroma = Math.min(0.19, Math.max(0.1, findMaxChromaForTone(hue, 60)))
    return { hue, hex: okyctToHex({ h: hue, c: chroma, t: 60 }) }
  })
}

export function buildSpectrumRing(seedHex: string): readonly string[] {
  return buildSpectrumStops(seedHex).map((stop) => stop.hex)
}

export function buildLandingPalette(seedHex: string): LandingPalette {
  const palettes = createPalettesFromSource(seedHex, 'tonalSpot', true)

  const rows: LandingPaletteRow[] = LandingToneRowKeys.map((key) => ({
    key,
    labelKey: LandingToneRowLabels[key],
    swatches: StandardTones.map((tone) => ({
      tone,
      hex: palettes[key].tone(tone),
    })),
  }))

  return {
    seedHex,
    rows,
    schemes: {
      light: buildDynamicScheme(palettes, false),
      dark: buildDynamicScheme(palettes, true),
    },
    accents: {
      primary: palettes.primary.tone(58),
      secondary: palettes.secondary.tone(62),
      tertiary: palettes.tertiary.tone(64),
      neutral: palettes.neutral.tone(92),
    },
    ringColors: buildSpectrumRing(seedHex),
    ringStops: buildSpectrumStops(seedHex),
  }
}

export function isReadableOn(hex: string): boolean {
  return hexToOkyct(hex).t < 58
}

/**
 * 自发光面板演示色块：固定种子色相，仅在 Tone 轴上移动。
 */
export function buildPanelSwatches(seedHex: string): readonly { tone: number; hex: string }[] {
  const base = hexToOkyct(seedHex)
  return [0, 4, 8, 92].map((tone) => {
    const chroma = Math.min(base.c, findMaxChromaForTone(base.h, tone))
    return { tone, hex: okyctToHex({ h: base.h, c: chroma, t: tone }) }
  })
}

/**
 * 地形粒子角色色带：surface（常态）/ primary（指针中心）/ tertiary（波峰边缘环）。
 *
 * 角色取色严格对齐 tonalSpot 变体：primary 取种子色相、tertiary 偏转 +60°、
 * surface 取 neutral 系（种子色相、极低彩度）。同一色带内保留正负 18 度的横向
 * 色相漂移因此相邻粒子仍保持梯度；角色之间在着色器里按径向权重连续
 * 混合不出现硬边界。
 *
 * 每个角色各有一条 low（波谷）/ high（波峰）色带：
 * 亮色模式波峰 Tone 更深、暗色模式波峰 Tone 更亮由库直接生成。
 */
export interface TerrainRoleRamp {
  readonly low: readonly string[]
  readonly high: readonly string[]
}

export interface TerrainRoleRamps {
  readonly surface: TerrainRoleRamp
  readonly primary: TerrainRoleRamp
  readonly tertiary: TerrainRoleRamp
}

const TerrainRoleHueDrift = 36

function buildTerrainRoleRamp(
  hue: number,
  chroma: number,
  lowTone: number,
  highTone: number,
  steps: number,
): TerrainRoleRamp {
  const low: string[] = []
  const high: string[] = []

  for (let index = 0; index < steps; index += 1) {
    const progress = index / (steps - 1)
    const driftedHue = (hue + (progress - 0.5) * TerrainRoleHueDrift + 360) % 360
    const cappedLow = Math.min(chroma, findMaxChromaForTone(driftedHue, lowTone) * 0.95)
    const cappedHigh = Math.min(chroma, findMaxChromaForTone(driftedHue, highTone) * 0.95)
    low.push(okyctToHex({ h: driftedHue, c: Math.max(0, cappedLow), t: lowTone }))
    high.push(okyctToHex({ h: driftedHue, c: Math.max(0, cappedHigh), t: highTone }))
  }

  return { low, high }
}

export function buildTerrainRoleRamps(seedHex: string, isDark: boolean, steps = 128): TerrainRoleRamps {
  const base = hexToOkyct(seedHex)
  const sourceChroma = Math.max(0.04, base.c)
  const neutralChroma = ((base.h >= 20 && base.h <= 110) || base.h >= 340) ? 0.012 : 0.014

  const primaryHue = base.h
  const primaryChroma = Math.max(0.09, Math.min(0.18, sourceChroma))
  const tertiaryHue = (base.h + 60) % 360
  const tertiaryChroma = Math.max(0.06, sourceChroma * 0.65)
  const surfaceHue = base.h
  const surfaceChroma = neutralChroma * 2.2

  if (isDark) {
    return {
      surface: buildTerrainRoleRamp(surfaceHue, surfaceChroma, 52, 80, steps),
      primary: buildTerrainRoleRamp(primaryHue, primaryChroma, 55, 88, steps),
      tertiary: buildTerrainRoleRamp(tertiaryHue, tertiaryChroma, 54, 86, steps),
    }
  }

  return {
    surface: buildTerrainRoleRamp(surfaceHue, surfaceChroma, 60, 42, steps),
    primary: buildTerrainRoleRamp(primaryHue, primaryChroma, 56, 30, steps),
    tertiary: buildTerrainRoleRamp(tertiaryHue, tertiaryChroma, 58, 33, steps),
  }
}
