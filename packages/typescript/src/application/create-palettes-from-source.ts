import { hexToOkyct } from '../domain/index.ts'
import {
  PaletteVariants,
  type CreatePalettesOptions,
  type PaletteVariant,
  type TonalPaletteOptions,
} from '../ports/index.ts'
import { harmonizeHex } from './harmonize-hex.ts'
import { isWarmHue } from './is-warm-hue.ts'
import type { PaletteSet } from './palette-set.ts'
import { TonalPalette } from './tonal-palette.ts'

export function createPalettesFromSource(
  sourceHex: string,
  options: CreatePalettesOptions = {}
): PaletteSet {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid createPalettesFromSource options: expected an object.')
  }
  const variant: PaletteVariant = options.variant ?? 'tonalSpot'
  if (!PaletteVariants.includes(variant)) {
    throw new Error(`Invalid palette variant: "${String(variant)}". Expected one of: ${PaletteVariants.join(', ')}.`)
  }
  if (options.harmonizeSemantics !== undefined && typeof options.harmonizeSemantics !== 'boolean') {
    throw new Error('Invalid harmonizeSemantics option: expected a boolean.')
  }
  const harmonizeSemantics = options.harmonizeSemantics ?? true

  const paletteOpts: TonalPaletteOptions = {
    gamut: options.gamut,
    hkCompensation: options.hkCompensation,
    softKnee: options.softKnee,
    maxCacheSize: options.maxCacheSize,
  }

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

  const errorPalette = TonalPalette.fromHex(errorHex, paletteOpts)
  const warningPalette = TonalPalette.fromHex(warningHex, paletteOpts)
  const successPalette = TonalPalette.fromHex(successHex, paletteOpts)
  const infoPalette = TonalPalette.fromHex(infoHex, paletteOpts)

  switch (variant) {
    case 'vibrant':
      return {
        primary: new TonalPalette(h, Math.max(0.12, c), paletteOpts),
        secondary: new TonalPalette((h + 25) % 360, Math.max(0.08, c * 0.7), paletteOpts),
        tertiary: new TonalPalette((h + 60) % 360, Math.max(0.1, c * 0.85), paletteOpts),
        neutral: new TonalPalette(h, neutralChroma * 1.5, paletteOpts),
        neutralVariant: new TonalPalette(h, neutralVariantChroma * 1.3, paletteOpts),
        error: errorPalette,
        warning: warningPalette,
        success: successPalette,
        info: infoPalette,
      }

    case 'expressive':
      return {
        primary: new TonalPalette(h, Math.max(0.1, c), paletteOpts),
        secondary: new TonalPalette((h + 90) % 360, Math.max(0.07, c * 0.65), paletteOpts),
        tertiary: new TonalPalette((h + 180) % 360, Math.max(0.09, c * 0.8), paletteOpts),
        neutral: new TonalPalette((h + 15) % 360, neutralChroma * 1.4, paletteOpts),
        neutralVariant: new TonalPalette((h + 15) % 360, neutralVariantChroma * 1.3, paletteOpts),
        error: errorPalette,
        warning: warningPalette,
        success: successPalette,
        info: infoPalette,
      }

    case 'neutral':
      return {
        primary: new TonalPalette(h, Math.min(0.08, c * 0.6), paletteOpts),
        secondary: new TonalPalette(h, Math.min(0.04, c * 0.35), paletteOpts),
        tertiary: new TonalPalette((h + 40) % 360, Math.min(0.05, c * 0.45), paletteOpts),
        neutral: new TonalPalette(h, neutralChroma * 0.8, paletteOpts),
        neutralVariant: new TonalPalette(h, neutralVariantChroma * 0.8, paletteOpts),
        error: errorPalette,
        warning: warningPalette,
        success: successPalette,
        info: infoPalette,
      }

    case 'monochrome':
      return {
        primary: new TonalPalette(h, 0, paletteOpts),
        secondary: new TonalPalette(h, 0, paletteOpts),
        tertiary: new TonalPalette(h, 0, paletteOpts),
        neutral: new TonalPalette(h, 0, paletteOpts),
        neutralVariant: new TonalPalette(h, 0, paletteOpts),
        error: errorPalette,
        warning: warningPalette,
        success: successPalette,
        info: infoPalette,
      }

    case 'fidelity':
      return {
        primary: new TonalPalette(h, c, paletteOpts),
        secondary: new TonalPalette((h + 15) % 360, c * 0.5, paletteOpts),
        tertiary: new TonalPalette((h + 30) % 360, c * 0.7, paletteOpts),
        neutral: new TonalPalette(h, neutralChroma, paletteOpts),
        neutralVariant: new TonalPalette(h, neutralVariantChroma, paletteOpts),
        error: errorPalette,
        warning: warningPalette,
        success: successPalette,
        info: infoPalette,
      }

    case 'tonalSpot':
    default:
      return {
        primary: new TonalPalette(h, Math.max(0.09, Math.min(0.18, c)), paletteOpts),
        secondary: new TonalPalette((h + 15) % 360, Math.max(0.04, c * 0.45), paletteOpts),
        tertiary: new TonalPalette((h + 60) % 360, Math.max(0.06, c * 0.65), paletteOpts),
        neutral: new TonalPalette(h, neutralChroma, paletteOpts),
        neutralVariant: new TonalPalette(h, neutralVariantChroma, paletteOpts),
        error: errorPalette,
        warning: warningPalette,
        success: successPalette,
        info: infoPalette,
      }
  }
}
