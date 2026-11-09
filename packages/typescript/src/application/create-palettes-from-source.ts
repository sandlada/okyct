
import { hexToOkyct } from '../domain/index.ts'
import type { PaletteVariant } from '../ports/inbound/palette-generation.port.ts'
import { TonalPalette } from './tonal-palette.ts'
import type { PaletteSet } from './palette-set.ts'
import { harmonizeHex } from './harmonize-hex.ts'
import { isWarmHue } from './is-warm-hue.ts'

export function createPalettesFromSource(
  sourceHex: string,
  variant: PaletteVariant = 'tonalSpot',
  harmonizeSemantics = true
): PaletteSet {
  const source = hexToOkyct(sourceHex)
  const h = source.h
  const c = Math.max(0.04, source.c)

  let errorHex = '#BA1A1A'
  let warningHex = '#E69900'
  let successHex = '#1E8E3E'
  let infoHex = '#0288D1'

  if (harmonizeSemantics) {
    errorHex = harmonizeHex(errorHex, sourceHex, 15)
    warningHex = harmonizeHex(warningHex, sourceHex, 18)
    successHex = harmonizeHex(successHex, sourceHex, 18)
    infoHex = harmonizeHex(infoHex, sourceHex, 18)
  }

  const neutralChroma = isWarmHue(h) ? 0.012 : 0.014
  const neutralVariantChroma = neutralChroma * 2.2

  switch (variant) {
    case 'vibrant': {
      return {
        primary: new TonalPalette(h, Math.max(0.12, c)),
        secondary: new TonalPalette((h + 25) % 360, Math.max(0.08, c * 0.7)),
        tertiary: new TonalPalette((h + 60) % 360, Math.max(0.1, c * 0.85)),
        neutral: new TonalPalette(h, neutralChroma * 1.5),
        neutralVariant: new TonalPalette(h, neutralVariantChroma * 1.3),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      }
    }

    case 'expressive': {
      return {
        primary: new TonalPalette(h, Math.max(0.1, c)),
        secondary: new TonalPalette((h + 90) % 360, Math.max(0.07, c * 0.65)),
        tertiary: new TonalPalette((h + 180) % 360, Math.max(0.09, c * 0.8)),
        neutral: new TonalPalette((h + 15) % 360, neutralChroma * 1.4),
        neutralVariant: new TonalPalette((h + 15) % 360, neutralVariantChroma * 1.3),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      }
    }

    case 'neutral': {
      return {
        primary: new TonalPalette(h, Math.min(0.08, c * 0.6)),
        secondary: new TonalPalette(h, Math.min(0.04, c * 0.35)),
        tertiary: new TonalPalette((h + 40) % 360, Math.min(0.05, c * 0.45)),
        neutral: new TonalPalette(h, neutralChroma * 0.8),
        neutralVariant: new TonalPalette(h, neutralVariantChroma * 0.8),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      }
    }

    case 'monochrome': {
      return {
        primary: new TonalPalette(h, 0),
        secondary: new TonalPalette(h, 0),
        tertiary: new TonalPalette(h, 0),
        neutral: new TonalPalette(h, 0),
        neutralVariant: new TonalPalette(h, 0),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      }
    }

    case 'fidelity': {
      return {
        primary: new TonalPalette(h, c),
        secondary: new TonalPalette((h + 15) % 360, c * 0.5),
        tertiary: new TonalPalette((h + 30) % 360, c * 0.7),
        neutral: new TonalPalette(h, neutralChroma),
        neutralVariant: new TonalPalette(h, neutralVariantChroma),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      }
    }

    case 'tonalSpot':
    default: {
      return {
        primary: new TonalPalette(h, Math.max(0.09, Math.min(0.18, c))),
        secondary: new TonalPalette((h + 15) % 360, Math.max(0.04, c * 0.45)),
        tertiary: new TonalPalette((h + 60) % 360, Math.max(0.06, c * 0.65)),
        neutral: new TonalPalette(h, neutralChroma),
        neutralVariant: new TonalPalette(h, neutralVariantChroma),
        error: TonalPalette.fromHex(errorHex),
        warning: TonalPalette.fromHex(warningHex),
        success: TonalPalette.fromHex(successHex),
        info: TonalPalette.fromHex(infoHex),
      }
    }
  }
}
