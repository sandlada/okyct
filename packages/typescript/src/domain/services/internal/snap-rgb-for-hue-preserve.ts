/**
 * [Domain Service — module internal]
 * 8-bit 量化时在 ±1 色阶邻域内优先最小化 OKLab 色相漂移（受 Tone 预算约束）
 */

import type { RGB } from '../../models/index.ts'
import { hexToRgb } from '../hex-to-rgb.ts'
import { rgbToOkyct } from '../rgb-to-okyct.ts'
import { rgbToHex } from '../rgb-to-hex.ts'
import { shortestHueDelta } from '../shortest-hue-delta.ts'

const HueSnapChannelRadius = 1
const HueSnapMaxToneDelta = 0.35
const HueSnapMinChromaForDrift = 0.01

function rgbFromBytes(r: number, g: number, b: number): RGB {
  return { r: r / 255, g: g / 255, b: b / 255 }
}

function hexFromBytes(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('')
  )
}

export function snapRgbToHexForHuePreserve(
  rgb: RGB,
  referenceHueDeg: number,
  nominalTone: number,
): string {
  const baselineHex = rgbToHex(rgb)
  const baselineOkyct = rgbToOkyct(hexToRgb(baselineHex))

  let bestHex = baselineHex
  let bestDrift =
    baselineOkyct.c > HueSnapMinChromaForDrift
      ? shortestHueDelta(baselineOkyct.h, referenceHueDeg)
      : 0
  let bestToneErr = Math.abs(baselineOkyct.t - nominalTone)

  const r0 = Math.max(0, Math.min(255, Math.round(rgb.r * 255)))
  const g0 = Math.max(0, Math.min(255, Math.round(rgb.g * 255)))
  const b0 = Math.max(0, Math.min(255, Math.round(rgb.b * 255)))

  const radius = HueSnapChannelRadius
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dg = -radius; dg <= radius; dg++) {
      for (let db = -radius; db <= radius; db++) {
        const r = r0 + dr
        const g = g0 + dg
        const b = b0 + db
        if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) continue

        const candidate = rgbToOkyct(rgbFromBytes(r, g, b))
        const toneErr = Math.abs(candidate.t - nominalTone)
        if (toneErr > HueSnapMaxToneDelta) continue

        const drift =
          candidate.c > HueSnapMinChromaForDrift
            ? shortestHueDelta(candidate.h, referenceHueDeg)
            : 0

        const better =
          drift < bestDrift - 1e-12 ||
          (Math.abs(drift - bestDrift) <= 1e-12 && toneErr < bestToneErr - 1e-12)

        if (better) {
          bestDrift = drift
          bestToneErr = toneErr
          bestHex = hexFromBytes(r, g, b)
        }
      }
    }
  }

  return bestHex
}
