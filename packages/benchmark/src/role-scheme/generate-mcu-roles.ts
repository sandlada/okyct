/**
 * MCU：CorePalette + Tone 二分命中 OKYCT 契约 CIE L*（不采用 Scheme.light 明度表）
 */

import { toneToY } from '@sandlada/okyct'
import {
  CorePalette,
  TonalPalette,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities'
import { yToCieLStar } from '../cie-l-star.ts'
import { hexToCielab } from '../referee/cielab.ts'
import {
  DarkSemanticRoleToneTargets,
  LightSemanticRoleToneTargets,
  SemanticContrastRoleTokens,
  SemanticRolePaletteBinding,
  type BenchmarkPaletteSlot,
  type SemanticContrastRoleToken,
  type SemanticRoleHexMap,
} from '../semantic-role-contract.ts'

const LStarMatchTolerance = 0.2
const MaxBinaryIterations = 16

function targetLStarForOkyctTone(tone: number): number {
  return yToCieLStar(toneToY(tone))
}

function paletteForSlot(
  core: CorePalette,
  slot: BenchmarkPaletteSlot,
): TonalPalette {
  switch (slot) {
    case 'primary':
      return core.a1
    case 'secondary':
      return core.a2
    case 'tertiary':
      return core.a3
    case 'neutral':
      return core.n1
    case 'neutralVariant':
      return core.n2
    case 'error':
      return core.error
  }
}

function hitLStarOnMcuPalette(
  palette: TonalPalette,
  targetLStar: number,
): string {
  let low = 0
  let high = 100
  let bestTone = 50
  let bestHex = '#000000'

  for (let i = 0; i < MaxBinaryIterations; i++) {
    const mid = (low + high) / 2
    const hex = hexFromArgb(palette.tone(mid)).toUpperCase()
    const lab = hexToCielab(hex)
    const err = lab.L - targetLStar
    bestTone = mid
    bestHex = hex
    if (Math.abs(err) <= LStarMatchTolerance) break
    if (err < 0) low = mid
    else high = mid
  }

  return hexFromArgb(palette.tone(bestTone)).toUpperCase()
}

function buildRoleMap(
  seedHex: string,
  toneTargets: Record<SemanticContrastRoleToken, number>,
): SemanticRoleHexMap {
  const core = CorePalette.of(argbFromHex(seedHex))

  const map = {} as SemanticRoleHexMap
  for (const token of SemanticContrastRoleTokens) {
    const slot = SemanticRolePaletteBinding[token]
    const palette = paletteForSlot(core, slot)
    const targetLStar = targetLStarForOkyctTone(toneTargets[token])
    map[token] = hitLStarOnMcuPalette(palette, targetLStar)
  }
  return map
}

export function generateMcuSemanticRoles(seedHex: string): {
  light: SemanticRoleHexMap
  dark: SemanticRoleHexMap
} {
  return {
    light: buildRoleMap(seedHex, LightSemanticRoleToneTargets),
    dark: buildRoleMap(seedHex, DarkSemanticRoleToneTargets),
  }
}
