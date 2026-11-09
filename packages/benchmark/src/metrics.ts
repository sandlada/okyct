/**
 * 共享评测指标（无 modelId 分支）
 */

import { hexToOkyct, getContrastRatio, getApcaContrast } from '@sandlada/okyct'
import { argbFromHex, Hct } from '@material/material-color-utilities'
import {
  cielabChroma,
  cielabHueDeg,
  hexToCielab,
  shortestHueDeltaDeg,
} from './referee/cielab.ts'
import type { ContrastGateRow, ModelColorStop, SemanticContrastModeResult } from './types.ts'
import {
  SemanticContrastPairCount,
  SemanticContrastRolePairs,
  type SemanticRoleHexMap,
} from './semantic-role-contract.ts'

const NeutralChromaCutoff = 2
const MinChromaForHue = 0.01

export interface WeightedHueTriplet {
  readonly cielab: number
  readonly oklab: number
  readonly hct: number
}

export function weightedHueTriplet(
  outputHex: string,
  seedCielabHue: number,
  seedOklabHue: number,
  seedHctHue: number,
): WeightedHueTriplet {
  const cielab = hexToCielab(outputHex)
  const oky = hexToOkyct(outputHex)
  const hct = Hct.fromInt(argbFromHex(outputHex))

  const cStar = cielabChroma(cielab)
  const dhCielab =
    cStar >= MinChromaForHue
      ? shortestHueDeltaDeg(cielabHueDeg(cielab), seedCielabHue) * (cStar / (cStar + 1))
      : 0
  const dhOklab =
    oky.c >= MinChromaForHue
      ? shortestHueDeltaDeg(oky.h, seedOklabHue) * (oky.c / (oky.c + 0.1))
      : 0
  const dhHct =
    hct.chroma >= 1
      ? shortestHueDeltaDeg(hct.hue, seedHctHue) * (hct.chroma / (hct.chroma + 1))
      : 0

  return {
    cielab: dhCielab,
    oklab: dhOklab,
    hct: dhHct,
  }
}

export function enrichStop(
  targetLStar: number,
  hex: string,
  seedCielabHue: number,
  seedOklabHue: number,
  seedHctHue: number,
  seedChromaCielab: number,
  alreadyQuantized: boolean,
): ModelColorStop {
  const lab = hexToCielab(hex)
  const oky = hexToOkyct(hex)
  const hueExcluded = seedChromaCielab < NeutralChromaCutoff
  const weighted = hueExcluded
    ? { cielab: 0, oklab: 0, hct: 0 }
    : weightedHueTriplet(hex, seedCielabHue, seedOklabHue, seedHctHue)

  return {
    stopName: `T${targetLStar}`,
    targetLStar,
    hex: hex.toUpperCase(),
    actualLStar: parseFloat(lab.L.toFixed(3)),
    deltaLStar: parseFloat(Math.abs(lab.L - targetLStar).toFixed(3)),
    actualTone: parseFloat(oky.t.toFixed(2)),
    weightedHueDeg: weighted,
    hueExcluded,
    alreadyQuantized,
  }
}

export function percentile95(values: readonly number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1)
  return sorted[index]
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export interface ContrastGateResult extends ContrastGateRow {}

function wcagFromHexPair(fgHex: string, bgHex: string): { wcag: number; apca: number } {
  const fgTone = hexToOkyct(fgHex).t
  const bgTone = hexToOkyct(bgHex).t
  const toneBg = Math.min(fgTone, bgTone)
  const toneFg = Math.max(fgTone, bgTone)
  const wcag = getContrastRatio(toneBg, toneFg)
  const apca = Math.abs(getApcaContrast(toneFg, toneBg))
  return { wcag, apca }
}

function evaluateRoleMapContrast(roleHex: SemanticRoleHexMap): ContrastGateRow[] {
  return SemanticContrastRolePairs.map(({ fg, bg }) => {
    const fgHex = roleHex[fg]
    const bgHex = roleHex[bg]
  const { wcag, apca } = wcagFromHexPair(fgHex, bgHex)
    return {
      pair: `${fg}/${bg}`,
      wcag: parseFloat(wcag.toFixed(2)),
      apca: parseFloat(apca.toFixed(1)),
      passesAa: wcag >= 4.5,
    }
  })
}

export function evaluateSemanticContrastGates(roles: {
  light: SemanticRoleHexMap
  dark: SemanticRoleHexMap
}): SemanticContrastModeResult {
  const lightGates = evaluateRoleMapContrast(roles.light)
  const darkGates = evaluateRoleMapContrast(roles.dark)
  const lightPass = lightGates.filter((g) => g.passesAa).length
  const darkPass = darkGates.filter((g) => g.passesAa).length
  return {
    light: {
      passCount: lightPass,
      pairCount: SemanticContrastPairCount,
      gates: lightGates,
    },
    dark: {
      passCount: darkPass,
      pairCount: SemanticContrastPairCount,
      gates: darkGates,
    },
  }
}

export function isHueRankingSpaceDependent(
  means: readonly { cielab: number; oklab: number; hct: number }[],
): boolean {
  if (means.length < 2) return false
  const bestCielab = means.reduce((b, m, i) => (m.cielab < means[b].cielab ? i : b), 0)
  const bestOklab = means.reduce((b, m, i) => (m.oklab < means[b].oklab ? i : b), 0)
  const bestHct = means.reduce((b, m, i) => (m.hct < means[b].hct ? i : b), 0)
  return bestCielab !== bestOklab || bestCielab !== bestHct
}
