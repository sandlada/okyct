/**
 * culori：tonalSpot OKLCH 轴 + L 二分命中契约 CIE L*（基准供给 token）
 */

import type { RGB } from '@sandlada/okyct'
import { toneToY } from '@sandlada/okyct'
import { clampChroma, oklch, rgb } from 'culori'
import { yToCieLStar } from '../cie-l-star.ts'
import { hexToCielab } from '../referee/cielab.ts'
import { quantizeNearest } from '../quantizer.ts'
import {
  DarkSemanticRoleToneTargets,
  LightSemanticRoleToneTargets,
  SemanticContrastRoleTokens,
  SemanticRolePaletteBinding,
  type SemanticContrastRoleToken,
  type SemanticRoleHexMap,
} from '../semantic-role-contract.ts'
import { buildTonalSpotOklchPalettes } from './tonal-spot-oklch.ts'

const LStarMatchTolerance = 0.05
const MaxBinaryIterations = 24

function targetLStarForOkyctTone(tone: number): number {
  return yToCieLStar(toneToY(tone))
}

function hitLStarOnOklchAxis(
  hue: number,
  chroma: number,
  targetLStar: number,
): string {
  let low = 0
  let high = 1
  let bestL = 0.5
  let bestRgb: RGB = { r: 0, g: 0, b: 0 }

  for (let i = 0; i < MaxBinaryIterations; i++) {
    const mid = (low + high) / 2
    const clamped = clampChroma(
      { mode: 'oklch' as const, l: mid, c: chroma, h: hue },
      'oklch',
    )
    const rgbColor = rgb(clamped)
    if (!rgbColor || rgbColor.mode !== 'rgb') {
      high = mid
      continue
    }
    const candidate: RGB = {
      r: rgbColor.r ?? 0,
      g: rgbColor.g ?? 0,
      b: rgbColor.b ?? 0,
    }
    const hex = quantizeNearest(candidate)
    const lab = hexToCielab(hex)
    const err = lab.L - targetLStar
    bestL = mid
    bestRgb = candidate
    if (Math.abs(err) <= LStarMatchTolerance) break
    if (err < 0) low = mid
    else high = mid
  }

  const finalClamped = clampChroma(
    { mode: 'oklch' as const, l: bestL, c: chroma, h: hue },
    'oklch',
  )
  const finalRgb = rgb(finalClamped)
  const continuousRgb: RGB = finalRgb
    ? { r: finalRgb.r ?? 0, g: finalRgb.g ?? 0, b: finalRgb.b ?? 0 }
    : bestRgb

  return quantizeNearest(continuousRgb)
}

function buildRoleMap(
  seedHex: string,
  toneTargets: Record<SemanticContrastRoleToken, number>,
): SemanticRoleHexMap {
  const palettes = buildTonalSpotOklchPalettes(seedHex, true)
  const map = {} as SemanticRoleHexMap
  for (const token of SemanticContrastRoleTokens) {
    const slot = SemanticRolePaletteBinding[token]
    const axis = palettes[slot]
    const targetLStar = targetLStarForOkyctTone(toneTargets[token])
    map[token] = hitLStarOnOklchAxis(axis.h, axis.c, targetLStar)
  }
  return map
}

export function generateCuloriSemanticRoles(seedHex: string): {
  light: SemanticRoleHexMap
  dark: SemanticRoleHexMap
} {
  return {
    light: buildRoleMap(seedHex, LightSemanticRoleToneTargets),
    dark: buildRoleMap(seedHex, DarkSemanticRoleToneTargets),
  }
}
