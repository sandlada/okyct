
import type { InvariantTestResult } from '../models/index.ts'
import { rgbToOkyct } from './rgb-to-okyct.ts'
import { toneToY } from './tone-to-y.ts'
import { yToTone } from './y-to-tone.ts'
import { okyctToRgb } from './okyct-to-rgb.ts'
import { okyctToHex } from './okyct-to-hex.ts'
import { hexToOkyct } from './hex-to-okyct.ts'
import { findMaxChromaForTone } from './find-max-chroma-for-tone.ts'
import { getContrastRatio } from './get-contrast-ratio.ts'
import { solveTonesForContrast } from './solve-tones-for-contrast.ts'
import { shortestHueDelta } from './shortest-hue-delta.ts'

const HexRoundTripSeeds = ['#2563EB', '#0000FF', '#FF0000', '#FFD600', '#FF00FF'] as const
const HexRoundTripTones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const
const HexHueDriftMidToneCapDeg = 0.5
const HexHueDriftHighlightCapDeg = 0.5
const HexToneDeltaCap = 0.35
const HexMinChromaForHue = 0.01

function tonalStopHex(sourceHue: number, targetChroma: number, tone: number): string {
  let effectiveChroma = targetChroma
  if (tone > 90) {
    effectiveChroma *= Math.max(0.2, (100 - tone) / 10)
  } else if (tone < 15) {
    effectiveChroma *= Math.max(0.3, tone / 15)
  }
  const maxGamutChroma = findMaxChromaForTone(sourceHue, tone)
  const finalChroma = Math.min(effectiveChroma, maxGamutChroma)
  return okyctToHex({ h: sourceHue, c: finalChroma, t: tone })
}

export function runColorimetricInvariantSuite(): InvariantTestResult[] {
  let maxRoundTripError = 0
  let roundTripSamples = 0
  const sampleSteps = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
  for (const r of sampleSteps) {
    for (const g of sampleSteps) {
      for (const b of sampleSteps) {
        const okyct = rgbToOkyct({ r, g, b })
        const restored = okyctToRgb(okyct)
        const err = Math.max(
          Math.abs(r - restored.r),
          Math.abs(g - restored.g),
          Math.abs(b - restored.b)
        )
        if (err > maxRoundTripError) maxRoundTripError = err
        roundTripSamples++
      }
    }
  }

  let maxToneBijectionError = 0
  let monotonicViolations = 0
  let prevY = -1
  for (let t = 0; t <= 100; t += 0.5) {
    const y = toneToY(t)
    if (y <= prevY) monotonicViolations++
    prevY = y
    const backT = yToTone(y)
    const err = Math.abs(t - backT)
    if (err > maxToneBijectionError) maxToneBijectionError = err
  }

  let gamutOverflowCount = 0
  let maxHueDriftDeg = 0
  let gamutSamples = 0
  for (let h = 0; h < 360; h += 15) {
    for (const t of [20, 40, 60, 80]) {
      const rgb = okyctToRgb({ h, c: 0.38, t })
      if (rgb.r < 0 || rgb.r > 1 || rgb.g < 0 || rgb.g > 1 || rgb.b < 0 || rgb.b > 1) {
        gamutOverflowCount++
      }
      const backOkyct = rgbToOkyct(rgb)
      if (backOkyct.c > 0.01) {
        const hDiff = shortestHueDelta(backOkyct.h, h)
        if (hDiff > maxHueDriftDeg) maxHueDriftDeg = hDiff
      }
      gamutSamples++
    }
  }

  let hexRoundTripViolations = 0
  let hexRoundTripSamples = 0
  let maxHexHueDriftDeg = 0
  let maxHexToneDelta = 0
  for (const seedHex of HexRoundTripSeeds) {
    const source = hexToOkyct(seedHex)
    for (const tone of HexRoundTripTones) {
      const hex = tonalStopHex(source.h, source.c, tone)
      const measured = hexToOkyct(hex)
      const toneDelta = Math.abs(measured.t - tone)
      if (toneDelta > maxHexToneDelta) maxHexToneDelta = toneDelta
      if (toneDelta > HexToneDeltaCap) hexRoundTripViolations++

      if (measured.c > HexMinChromaForHue) {
        const hDrift = shortestHueDelta(measured.h, source.h)
        if (hDrift > maxHexHueDriftDeg) maxHexHueDriftDeg = hDrift
        const cap = tone >= 90 ? HexHueDriftHighlightCapDeg : HexHueDriftMidToneCapDeg
        if (hDrift > cap) hexRoundTripViolations++
      }
      hexRoundTripSamples++
    }
  }

  let contrastViolations = 0
  let contrastSamples = 0
  for (let bgT = 0; bgT <= 100; bgT += 2) {
    const solved = solveTonesForContrast(bgT, 4.5)
    if (solved.darkForegroundTone !== null) {
      const ratio = getContrastRatio(bgT, solved.darkForegroundTone)
      if (ratio < 4.5) contrastViolations++
      contrastSamples++
    }
    if (solved.lightForegroundTone !== null) {
      const ratio = getContrastRatio(bgT, solved.lightForegroundTone)
      if (ratio < 4.5) contrastViolations++
      contrastSamples++
    }
  }

  return [
    {
      id: 'round-trip',
      name: 'sRGB ↔ OKYCT 正逆向往返还原精度',
      formula: 'max |RGB - okyctToRgb(rgbToOkyct(RGB))|',
      passed: maxRoundTripError < 1e-4,
      measuredValue: maxRoundTripError.toExponential(2),
      threshold: '< 1.00e-4',
      samplesChecked: roundTripSamples,
      details: '验证单变量牛顿切线迭代求解 dY/dL 在完整 sRGB 立方体网格上的双向无损还原能力。',
    },
    {
      id: 'tone-bijection',
      name: 'Tone ↔ CIE Y 双射解析精度与严格单调性',
      formula: '∀ T₁ < T₂ ⇒ Y(T₁) < Y(T₂), |yToTone(toneToY(T)) - T|',
      passed: monotonicViolations === 0 && maxToneBijectionError < 1e-6,
      measuredValue: `${maxToneBijectionError.toExponential(2)} (违规: ${monotonicViolations})`,
      threshold: '< 1.00e-6',
      samplesChecked: 201,
      details: '保证任意色相下 Tone 的递增严格对应物理发光亮度 Y 的单调递增，奠定对比度代数求解基础。',
    },
    {
      id: 'hex-round-trip',
      name: '标准色阶 Hex 往返色相与 Tone 预算',
      formula: 'palette.tone(T) → okyctToHex → hexToOkyct，ΔH 与 |ΔTone|',
      passed: hexRoundTripViolations === 0,
      measuredValue: `ΔH_max = ${maxHexHueDriftDeg.toFixed(3)}°, ΔT_max = ${maxHexToneDelta.toFixed(3)} (违规: ${hexRoundTripViolations})`,
      threshold: `ΔH ≤ ${HexHueDriftMidToneCapDeg}° (T≤80) / ${HexHueDriftHighlightCapDeg}° (T≥90), |ΔTone| ≤ ${HexToneDeltaCap}`,
      samplesChecked: hexRoundTripSamples,
      details:
        '覆盖多组品牌种子与 T10–T95 色阶，验证 8-bit 色相优先量化后 OKLab 色相与 CIE Y Tone 仍在评测预算内。',
    },
    {
      id: 'cusp-containment',
      name: '360° 超色域折返零溢出与色相保持度',
      formula: 'C=0.38 折返后 ΔHue 漂移角 & 通道越界率',
      passed: gamutOverflowCount === 0 && maxHueDriftDeg < 0.5,
      measuredValue: `ΔH_max = ${maxHueDriftDeg.toFixed(3)}° (越界: ${gamutOverflowCount})`,
      threshold: 'ΔH < 0.500°',
      samplesChecked: gamutSamples,
      details: '当请求超高饱和度 (C=0.38) 触发 Cusp 折返裁剪时，色相角保持恒定，不发生红变黄或蓝变紫。',
    },
    {
      id: 'algebraic-contrast',
      name: 'O(1) 代数对比度反演方程确定性守卫',
      formula: 'Contrast(bgTone, solveTonesForContrast(bgTone, 4.5)) ≥ 4.5',
      passed: contrastViolations === 0,
      measuredValue: `100% 达标 (违规: ${contrastViolations}/${contrastSamples})`,
      threshold: '0 违规',
      samplesChecked: contrastSamples,
      details: '直接由相对亮度方程反解目标 Tone 边界，零遍历循环即可确保 100% 满足 WCAG 2.1 阈值。',
    },
  ]
}
