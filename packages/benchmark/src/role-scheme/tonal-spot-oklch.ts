/**
 * tonalSpot 调色板轴（与 createPalettesFromSource 一致，输出 OKLCH h/c 供 culori）
 */

import {
  harmonizeHex,
  hexToOkyct,
  isWarmHue,
} from '@sandlada/okyct'
import { oklch } from 'culori'
import type { BenchmarkPaletteSlot } from '../semantic-role-contract.ts'

export interface OklchPaletteAxis {
  readonly h: number
  readonly c: number
}

export type TonalSpotOklchPalettes = Record<BenchmarkPaletteSlot, OklchPaletteAxis>

function axisFromHex(hex: string): OklchPaletteAxis {
  const parsed = oklch(hex)
  return {
    h: parsed?.h ?? 0,
    c: Math.max(0, parsed?.c ?? 0),
  }
}

export function buildTonalSpotOklchPalettes(
  sourceHex: string,
  harmonizeSemantics = true,
): TonalSpotOklchPalettes {
  const source = hexToOkyct(sourceHex)
  const h = source.h
  const c = Math.max(0.04, source.c)

  let errorHex = '#BA1A1A'
  if (harmonizeSemantics) {
    errorHex = harmonizeHex(errorHex, sourceHex, 15)
  }

  const neutralChroma = isWarmHue(h) ? 0.012 : 0.014
  const neutralVariantChroma = neutralChroma * 2.2

  return {
    primary: { h, c: Math.max(0.09, Math.min(0.18, c)) },
    secondary: { h: (h + 15) % 360, c: Math.max(0.04, c * 0.45) },
    tertiary: { h: (h + 60) % 360, c: Math.max(0.06, c * 0.65) },
    neutral: { h, c: neutralChroma },
    neutralVariant: { h, c: neutralVariantChroma },
    error: axisFromHex(errorHex),
  }
}
