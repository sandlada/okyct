import type { ContrastMetric, GamutTarget } from '../../domain/index.ts'
import {
  ThemeModes,
  buildDynamicSchemeWithPhysics,
  createPalettesFromSource,
  type PaletteSet,
  type PaletteVariant,
  type ThemeMode,
} from '../../application/index.ts'
import type { DynamicSchemeColors } from '../../ports/inbound/scheme-building.port.ts'
import type { EmissiveSchemeOptions } from '../../ports/outbound/display-physics.port.ts'
import { OledDisplayPhysicsSingleton } from './internal/oled-display-physics-adapter.ts'

export interface BuildSchemeOptions {
  mode?: ThemeMode
  variant?: PaletteVariant
  harmonizeSemantics?: boolean
  contrastLevel?: number
  contrastMetric?: ContrastMetric
  emissive?: EmissiveSchemeOptions
  gamut?: GamutTarget
  hkCompensation?: boolean
  softKnee?: boolean
}

export function buildDynamicScheme(
  sourceOrPalettes: string | PaletteSet,
  options: BuildSchemeOptions = {}
): DynamicSchemeColors {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid buildDynamicScheme options: expected a BuildSchemeOptions object.')
  }

  const mode = options.mode ?? 'dark'
  if (!ThemeModes.includes(mode)) {
    throw new Error(`Invalid theme mode: "${String(mode)}". Expected one of: ${ThemeModes.join(', ')}.`)
  }

  const palettes =
    typeof sourceOrPalettes === 'string'
      ? createPalettesFromSource(sourceOrPalettes, {
          variant: options.variant,
          harmonizeSemantics: options.harmonizeSemantics,
          gamut: options.gamut,
          hkCompensation: options.hkCompensation,
          softKnee: options.softKnee,
        })
      : sourceOrPalettes

  return buildDynamicSchemeWithPhysics(
    palettes,
    {
      mode,
      contrastLevel: options.contrastLevel,
      contrastMetric: options.contrastMetric,
      emissive: options.emissive,
    },
    OledDisplayPhysicsSingleton
  )
}
