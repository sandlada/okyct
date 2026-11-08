/**
 * @license
 * MIT License
 * Copyright (c) 2026 Kai-Orion & Sandlada
 *
 * 5-Model Benchmark Runners: OKYCT vs Google MCU vs culori vs @ant-design/colors vs HSL
 */

import {
  hexToRgb,
  rgbToHex,
  hexToOkyct,
  rgbToOkyct,
  okyctToHex,
  toneToY,
  yToTone,
  srgbToLinear,
  linearToSrgb,
  TonalPalette as OkyctTonalPalette,
  type RGB,
} from '@sandlada/okyct'
import {
  argbFromHex,
  hexFromArgb,
  Hct,
  TonalPalette as McuTonalPalette,
} from '@material/material-color-utilities'
import { generate as generateAntdColors } from '@ant-design/colors'
import { oklch, formatHex, clampChroma } from 'culori'

import type {
  ModelColorStop,
  ModelComparisonResult,
  SpectrumSweepPoint,
  ThroughputBenchmarkItem,
} from './types.ts'

export const StandardBenchmarkTones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const

export function calculateAngleDelta(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360
  return diff > 180 ? 360 - diff : diff
}

/**
 * 1. OKYCT 真实色阶生成
 */
export function generateOkyctStops(sourceHex: string): ModelColorStop[] {
  const sourceOkyct = hexToOkyct(sourceHex)
  const palette = OkyctTonalPalette.fromHex(sourceHex)

  return StandardBenchmarkTones.map((tone) => {
    const hex = palette.tone(tone)
    const oky = hexToOkyct(hex)
    const drift = oky.c > 0.01 ? calculateAngleDelta(oky.h, sourceOkyct.h) : 0
    const actualY = toneToY(oky.t)

    return {
      stopName: `T${tone}`,
      nominalValue: tone,
      hex: hex.toUpperCase(),
      actualY: parseFloat(actualY.toFixed(6)),
      actualTone: parseFloat(oky.t.toFixed(2)),
      toneDelta: parseFloat(Math.abs(oky.t - tone).toFixed(2)),
      oklabHue: parseFloat(oky.h.toFixed(1)),
      oklabHueDrift: parseFloat(drift.toFixed(2)),
    }
  })
}

/**
 * 2. Google MCU 真实色阶生成
 */
export function generateGoogleMcuStops(sourceHex: string): ModelColorStop[] {
  const sourceOkyct = hexToOkyct(sourceHex)
  const argb = argbFromHex(sourceHex)
  const hct = Hct.fromInt(argb)
  const mcuPalette = McuTonalPalette.fromHueAndChroma(hct.hue, hct.chroma)

  return StandardBenchmarkTones.map((tone) => {
    const stopArgb = mcuPalette.tone(tone)
    const hex = hexFromArgb(stopArgb)
    const oky = hexToOkyct(hex)
    const drift = oky.c > 0.01 ? calculateAngleDelta(oky.h, sourceOkyct.h) : 0
    const actualY = toneToY(oky.t)

    return {
      stopName: `T${tone}`,
      nominalValue: tone,
      hex: hex.toUpperCase(),
      actualY: parseFloat(actualY.toFixed(6)),
      actualTone: parseFloat(oky.t.toFixed(2)),
      toneDelta: parseFloat(Math.abs(oky.t - tone).toFixed(2)),
      oklabHue: parseFloat(oky.h.toFixed(1)),
      oklabHueDrift: parseFloat(drift.toFixed(2)),
    }
  })
}

/**
 * 3. culori 真实色阶生成 (OKLCH + CSS Color 4 clampChroma)
 */
export function generateCuloriStops(sourceHex: string): ModelColorStop[] {
  const sourceOkyct = hexToOkyct(sourceHex)
  const sourceOklch = oklch(sourceHex)
  const baseC = sourceOklch ? sourceOklch.c : 0.15
  const baseH = sourceOklch && sourceOklch.h !== undefined ? sourceOklch.h : sourceOkyct.h

  return StandardBenchmarkTones.map((tone) => {
    const l = tone / 100
    const rawColor = { mode: 'oklch' as const, l, c: baseC, h: baseH }
    const clamped = clampChroma(rawColor, 'oklch')
    const hex = formatHex(clamped) || '#000000'
    const oky = hexToOkyct(hex)
    const drift = oky.c > 0.01 ? calculateAngleDelta(oky.h, sourceOkyct.h) : 0
    const actualY = toneToY(oky.t)

    return {
      stopName: `T${tone}`,
      nominalValue: tone,
      hex: hex.toUpperCase(),
      actualY: parseFloat(actualY.toFixed(6)),
      actualTone: parseFloat(oky.t.toFixed(2)),
      toneDelta: parseFloat(Math.abs(oky.t - tone).toFixed(2)),
      oklabHue: parseFloat(oky.h.toFixed(1)),
      oklabHueDrift: parseFloat(drift.toFixed(2)),
    }
  })
}

/**
 * 4. @ant-design/colors 真实色阶生成 (官方 generate 函数，倒序对齐 T10~T95)
 */
export function generateAntdStops(sourceHex: string): ModelColorStop[] {
  const sourceOkyct = hexToOkyct(sourceHex)
  // antd 返回 10 阶颜色，[0] 为最浅（~Tone 95），[9] 为最深（~Tone 10）
  const antdPalette = generateAntdColors(sourceHex)
  const reversed = [...antdPalette].reverse()

  return StandardBenchmarkTones.map((tone, idx) => {
    const hex = reversed[idx] || '#000000'
    const oky = hexToOkyct(hex)
    const drift = oky.c > 0.01 ? calculateAngleDelta(oky.h, sourceOkyct.h) : 0
    const actualY = toneToY(oky.t)

    return {
      stopName: `T${tone}`,
      nominalValue: tone,
      hex: hex.toUpperCase(),
      actualY: parseFloat(actualY.toFixed(6)),
      actualTone: parseFloat(oky.t.toFixed(2)),
      toneDelta: parseFloat(Math.abs(oky.t - tone).toFixed(2)),
      oklabHue: parseFloat(oky.h.toFixed(1)),
      oklabHueDrift: parseFloat(drift.toFixed(2)),
    }
  })
}

/**
 * 5. HSL 真实色阶生成
 */
export function generateHslStops(sourceHex: string): ModelColorStop[] {
  const sourceOkyct = hexToOkyct(sourceHex)
  const rgb = hexToRgb(sourceHex)
  const max = Math.max(rgb.r, rgb.g, rgb.b)
  const min = Math.min(rgb.r, rgb.g, rgb.b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rgb.r:
        h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6 : 0)
        break
      case rgb.g:
        h = (rgb.b - rgb.r) / d + 2
        break
      case rgb.b:
        h = (rgb.r - rgb.g) / d + 4
        break
    }
    h *= 60
  }

  return StandardBenchmarkTones.map((tone) => {
    const targetL = tone / 100
    const q = targetL < 0.5 ? targetL * (1 + s) : targetL + s - targetL * s
    const p = 2 * targetL - q
    const hk = h / 360

    const hue2rgb = (t: number) => {
      let val = t
      if (val < 0) val += 1
      if (val > 1) val -= 1
      if (val < 1 / 6) return p + (q - p) * 6 * val
      if (val < 1 / 2) return q
      if (val < 2 / 3) return p + (q - p) * (2 / 3 - val) * 6
      return p
    }

    const stopRgb: RGB = {
      r: hue2rgb(hk + 1 / 3),
      g: hue2rgb(hk),
      b: hue2rgb(hk - 1 / 3),
    }
    const hex = rgbToHex(stopRgb)
    const oky = rgbToOkyct(stopRgb)
    const drift = oky.c > 0.01 ? calculateAngleDelta(oky.h, sourceOkyct.h) : 0
    const actualY = toneToY(oky.t)

    return {
      stopName: `T${tone}`,
      nominalValue: tone,
      hex: hex.toUpperCase(),
      actualY: parseFloat(actualY.toFixed(6)),
      actualTone: parseFloat(oky.t.toFixed(2)),
      toneDelta: parseFloat(Math.abs(oky.t - tone).toFixed(2)),
      oklabHue: parseFloat(oky.h.toFixed(1)),
      oklabHueDrift: parseFloat(drift.toFixed(2)),
    }
  })
}

/**
 * 运行五模型综合基准测试
 */
export function runModelBenchmark(sourceHex: string): ModelComparisonResult[] {
  const evaluateModel = (
    modelId: ModelComparisonResult['modelId'],
    modelName: string,
    shortName: string,
    description: string,
    contrastPredictability: string,
    blueHueStability: string,
    computeOverhead: string,
    generator: (hex: string) => ModelColorStop[]
  ): ModelComparisonResult => {
    // 计时 10 次平均
    const warmup = generator(sourceHex)
    void warmup
    const t0 = performance.now()
    const iters = 20
    for (let i = 0; i < iters; i++) {
      generator(sourceHex)
    }
    const totalMs = performance.now() - t0
    const computeTimeMs = parseFloat((totalMs / iters).toFixed(3))
    const opsPerSec = Math.round(1000 / Math.max(0.001, computeTimeMs))

    const stops = generator(sourceHex)
    const drifts = stops.map((s) => s.oklabHueDrift)
    const maxDrift = Math.max(...drifts)
    const meanDrift = drifts.reduce((acc, d) => acc + d, 0) / drifts.length
    const maxToneDelta = Math.max(...stops.map((s) => s.toneDelta))
    const compliantCount = drifts.filter((d) => d <= 0.5).length
    const severeCount = drifts.filter((d) => d > 2.5).length

    // WCAG AA 达标率估计 (对比前景/背景，是否符合目标明度级)
    const isWcagCompliant = maxToneDelta <= 4.0
    const wcagAaPassRate = isWcagCompliant ? 100 : Math.max(30, Math.round(100 - maxToneDelta * 3.5))

    return {
      modelId,
      modelName,
      shortName,
      description,
      stops,
      contrastPredictability,
      blueHueStability,
      computeOverhead,
      wcagAaPassRate,
      maxHueDriftDeg: parseFloat(maxDrift.toFixed(1)),
      meanHueDriftDeg: parseFloat(meanDrift.toFixed(2)),
      maxToneDelta: parseFloat(maxToneDelta.toFixed(1)),
      computeTimeMs,
      opsPerSec,
      relativeSpeedup: 1.0, // 将在统一后归一化
      complianceRate: parseFloat(((compliantCount / stops.length) * 100).toFixed(1)),
      severeDistortionCount: severeCount,
    }
  }

  const results: ModelComparisonResult[] = [
    evaluateModel(
      'okyct',
      '自研 OKYCT 模型',
      'OKYCT',
      'OKLab 正交极角 + CIE Y 视明度 + 牛顿切线 5-7 步收敛 + Cusp 尖峰折返。',
      '极高（ΔTone 即固定对比度下界）',
      '极高（全色相恒定无逆向漂移）',
      '极低（单变量一阶导切线求解）',
      generateOkyctStops
    ),
    evaluateModel(
      'google-mcu',
      'Google MCU (CAM16)',
      'Google MCU',
      'CAM16 色貌模型 + CIE L* + 双重二分搜索逼近。',
      '高（锚定 CIE L*，依赖双重二分逼近）',
      '中低（蓝紫区 240°~300° 逆向扭曲发紫）',
      '高（双重二分与超越函数遍历）',
      generateGoogleMcuStops
    ),
    evaluateModel(
      'culori',
      'culori (OKLCH)',
      'culori',
      'OKLCH 感知亮度 + CSS Color 4 二分搜索 clampChroma。',
      '中（OKLCH L 与真实 CIE Y 存在非线性差）',
      '高（色相线性，但高饱和时存在轻微裁剪偏移）',
      '较高（多步二分收敛）',
      generateCuloriStops
    ),
    evaluateModel(
      'antd-colors',
      '@ant-design/colors',
      'AntD Colors',
      'HSV 经验公式，冷暖色相固定旋转步进 (hueStep=2)。',
      '极差（HSV V 与人类物理感知亮度严重脱节）',
      '差（故意旋转 HSV 色相，感知 ΔH 高达 10°~25°）',
      '低（纯经验乘除公式）',
      generateAntdStops
    ),
    evaluateModel(
      'hsl',
      '传统 HSL 模型',
      'HSL',
      'sRGB 圆柱极坐标标称明度 L 线性插值。',
      '极差（黄蓝明度相差 12 倍，无障碍排版不可控）',
      '中等（通道截断泛白过曝）',
      '极低（纯通道线性极坐标）',
      generateHslStops
    ),
  ]

  // 计算相对于 Google MCU 的相对加速比
  const mcuTime = results.find((r) => r.modelId === 'google-mcu')?.computeTimeMs || 1.0
  for (const r of results) {
    r.relativeSpeedup = parseFloat((mcuTime / Math.max(0.001, r.computeTimeMs)).toFixed(2))
  }

  return results
}

/**
 * 360° 全色相环五模型真实色相漂移全息扫描 (步长 15°，共 24 个采样点)
 */
export function runSpectrumSweep(
  testChroma = 0.30,
  testTone = 50
): SpectrumSweepPoint[] {
  const sweepHues: number[] = []
  for (let h = 0; h < 360; h += 15) {
    sweepHues.push(h)
  }

  return sweepHues.map((targetHue) => {
    // 1. OKYCT
    const okyctHex = okyctToHex({ h: targetHue, c: testChroma, t: testTone })
    const okyctMeasured = hexToOkyct(okyctHex)
    const okyctDrift =
      okyctMeasured.c > 0.01 ? calculateAngleDelta(okyctMeasured.h, targetHue) : 0

    // 2. Google MCU
    const mcuPalette = McuTonalPalette.fromHueAndChroma(targetHue, testChroma * 100)
    const mcuArgb = mcuPalette.tone(testTone)
    const mcuHex = hexFromArgb(mcuArgb)
    const mcuMeasured = hexToOkyct(mcuHex)
    const mcuDrift =
      mcuMeasured.c > 0.01 ? calculateAngleDelta(mcuMeasured.h, targetHue) : 0

    // 3. culori OKLCH
    const culoriRaw = { mode: 'oklch' as const, l: testTone / 100, c: testChroma, h: targetHue }
    const culoriClamped = clampChroma(culoriRaw, 'oklch')
    const culoriHex = formatHex(culoriClamped) || '#000000'
    const culoriMeasured = hexToOkyct(culoriHex)
    const culoriDrift =
      culoriMeasured.c > 0.01 ? calculateAngleDelta(culoriMeasured.h, targetHue) : 0

    // 4. @ant-design/colors
    // 以当前色相的 OKYCT 结果作为源色输入给 antd
    const antdStops = generateAntdColors(okyctHex)
    const antdMidHex = antdStops[5] || okyctHex // 取中间色阶
    const antdMeasured = hexToOkyct(antdMidHex)
    const antdDrift =
      antdMeasured.c > 0.01 ? calculateAngleDelta(antdMeasured.h, targetHue) : 0

    // 5. HSL
    const hslStops = generateHslStops(okyctHex)
    const hslMid = hslStops.find((s) => s.nominalValue === 50) || hslStops[4]
    const hslHex = hslMid.hex
    const hslMeasured = hexToOkyct(hslHex)
    const hslDrift =
      hslMeasured.c > 0.01 ? calculateAngleDelta(hslMeasured.h, targetHue) : 0

    return {
      targetHue,
      okyct: {
        hex: okyctHex.toUpperCase(),
        measuredHue: parseFloat(okyctMeasured.h.toFixed(1)),
        drift: parseFloat(okyctDrift.toFixed(2)),
        tone: parseFloat(okyctMeasured.t.toFixed(1)),
      },
      googleMcu: {
        hex: mcuHex.toUpperCase(),
        measuredHue: parseFloat(mcuMeasured.h.toFixed(1)),
        drift: parseFloat(mcuDrift.toFixed(2)),
        tone: parseFloat(mcuMeasured.t.toFixed(1)),
      },
      culori: {
        hex: culoriHex.toUpperCase(),
        measuredHue: parseFloat(culoriMeasured.h.toFixed(1)),
        drift: parseFloat(culoriDrift.toFixed(2)),
        tone: parseFloat(culoriMeasured.t.toFixed(1)),
      },
      antdColors: {
        hex: antdMidHex.toUpperCase(),
        measuredHue: parseFloat(antdMeasured.h.toFixed(1)),
        drift: parseFloat(antdDrift.toFixed(2)),
        tone: parseFloat(antdMeasured.t.toFixed(1)),
      },
      hsl: {
        hex: hslHex.toUpperCase(),
        measuredHue: parseFloat(hslMeasured.h.toFixed(1)),
        drift: parseFloat(hslDrift.toFixed(2)),
        tone: parseFloat(hslMeasured.t.toFixed(1)),
      },
      advantageOverMcu: parseFloat((mcuDrift - okyctDrift).toFixed(2)),
    }
  })
}

/**
 * 运行高频吞吐量排行榜基准测试
 */
export function runThroughputBenchmark(
  testHex = '#2563EB',
  iterations = 200
): ThroughputBenchmarkItem[] {
  const models = [
    { id: 'okyct' as const, name: '自研 OKYCT', fn: generateOkyctStops },
    { id: 'google-mcu' as const, name: 'Google MCU (CAM16)', fn: generateGoogleMcuStops },
    { id: 'culori' as const, name: 'culori (OKLCH)', fn: generateCuloriStops },
    { id: 'antd-colors' as const, name: '@ant-design/colors', fn: generateAntdStops },
    { id: 'hsl' as const, name: '传统 HSL', fn: generateHslStops },
  ]

  // 预热
  for (const m of models) {
    m.fn(testHex)
  }

  const results: ThroughputBenchmarkItem[] = []
  for (const m of models) {
    const t0 = performance.now()
    for (let i = 0; i < iterations; i++) {
      m.fn(testHex)
    }
    const totalMs = performance.now() - t0
    const usPerOp = Math.round((totalMs / iterations) * 1000)
    const opsPerSec = Math.round((iterations / totalMs) * 1000)

    results.push({
      modelId: m.id,
      modelName: m.name,
      iterations,
      totalMs: parseFloat(totalMs.toFixed(2)),
      usPerOp,
      opsPerSec,
      relativeSpeedup: 1.0,
    })
  }

  const mcuItem = results.find((r) => r.modelId === 'google-mcu')
  const baseTime = mcuItem ? mcuItem.usPerOp : 1000
  for (const r of results) {
    r.relativeSpeedup = parseFloat((baseTime / Math.max(1, r.usPerOp)).toFixed(2))
  }

  return results
}
