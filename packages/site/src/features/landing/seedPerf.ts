/**
 * 落地页种子色实时性能测量：T60 色相拉杆的轻量 L1 计算。
 * 重型落地页推导（色板 / 地形 / 粒子重建）只在松手提交时触发，
 * 这里只做单点 okyctToHex + Cmax + 功耗遥测，供卡片实时显示。
 */

import { computeColorEmissiveTelemetry } from '../../color/emissive.ts'
import {
  findMaxChromaForTone,
  getContrastRatio,
  hexToOkyct,
  isInSrgbGamut,
  okyctToHex,
  toneToY,
} from '../../color/math.ts'

const SliderPreviewTone = 60
const SliderPreviewChromaMin = 0.1
const SliderPreviewChromaMax = 0.19

export const SolveBudgetMs = 8

export interface HueSeedPerformance {
  readonly hue: number
  readonly hex: string
  readonly chroma: number
  readonly tone: number
  readonly y: number
  readonly vsWhite: number
  readonly vsBlack: number
  readonly cmax: number
  readonly inGamut: boolean
  readonly hueDriftDeg: number
  readonly solveMs: number
  readonly powerMw: number
  readonly blueStressIndex: number
  readonly aplPercent: number
}

function angularDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360
  return raw > 180 ? 360 - raw : raw
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

/**
 * T60 等明度色相预览：拉杆拖动时的实时计算路径。
 * 固定 Tone 60，与首屏光谱环停靠点生成逻辑同源。
 */
export function measureHueSeedPerformance(hue: number): HueSeedPerformance {
  const normalized = normalizeHue(hue)
  const start = performance.now()
  const cmax = findMaxChromaForTone(normalized, SliderPreviewTone)
  const chroma = Math.min(SliderPreviewChromaMax, Math.max(SliderPreviewChromaMin, cmax))
  const hex = okyctToHex({ h: normalized, c: chroma, t: SliderPreviewTone })
  const rendered = hexToOkyct(hex)
  const hueDriftDeg = angularDistance(normalized, rendered.h)
  const inGamut = isInSrgbGamut(normalized, chroma, SliderPreviewTone).inGamut
  const y = toneToY(SliderPreviewTone)
  const vsWhite = getContrastRatio(SliderPreviewTone, 100)
  const vsBlack = getContrastRatio(SliderPreviewTone, 0)
  const telemetry = computeColorEmissiveTelemetry(hex)
  const end = performance.now()
  return {
    hue: normalized,
    hex,
    chroma,
    tone: SliderPreviewTone,
    y,
    vsWhite,
    vsBlack,
    cmax,
    inGamut,
    hueDriftDeg,
    solveMs: end - start,
    powerMw: telemetry.powerMw,
    blueStressIndex: telemetry.blueStressIndex,
    aplPercent: telemetry.aplPercent,
  }
}

/**
 * 已提交种子色的完整测量：保留种子自身的 H/C/T，只做单点往返与遥测。
 */
export function measureSeedHexPerformance(hex: string): HueSeedPerformance {
  const start = performance.now()
  const okyct = hexToOkyct(hex)
  const cmax = findMaxChromaForTone(okyct.h, okyct.t)
  const roundtripHex = okyctToHex(okyct)
  const rendered = hexToOkyct(roundtripHex)
  const hueDriftDeg = angularDistance(okyct.h, rendered.h)
  const inGamut = isInSrgbGamut(okyct.h, okyct.c, okyct.t).inGamut
  const y = toneToY(okyct.t)
  const vsWhite = getContrastRatio(okyct.t, 100)
  const vsBlack = getContrastRatio(okyct.t, 0)
  const telemetry = computeColorEmissiveTelemetry(hex)
  const end = performance.now()
  return {
    hue: okyct.h,
    hex,
    chroma: okyct.c,
    tone: okyct.t,
    y,
    vsWhite,
    vsBlack,
    cmax,
    inGamut,
    hueDriftDeg,
    solveMs: end - start,
    powerMw: telemetry.powerMw,
    blueStressIndex: telemetry.blueStressIndex,
    aplPercent: telemetry.aplPercent,
  }
}

/**
 * 拉杆固定背景：绝对色相刻度 0°→360°（T60 等明度），与种子无关。
 * 背景只算一次、永不转动，拖动时只有滑杆在动。
 */
export function buildAbsoluteHueGradient(): string {
  const stops: string[] = []
  for (let hue = 0; hue <= 360; hue += 10) {
    const capped = Math.min(
      SliderPreviewChromaMax,
      Math.max(SliderPreviewChromaMin, findMaxChromaForTone(hue, SliderPreviewTone)),
    )
    stops.push(okyctToHex({ h: hue, c: capped, t: SliderPreviewTone }))
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`
}
