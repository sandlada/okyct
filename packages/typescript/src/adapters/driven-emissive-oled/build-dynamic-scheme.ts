import type { ContrastMetric, GamutTarget } from '../../domain/index.ts'
import {
  ThemeModes,
  buildDynamicSchemeWithPhysics,
  createPalettesFromSource,
  type AmbientSurround,
  type PaletteSet,
  type PaletteVariant,
  type StateLayerBlendSpace,
  type ThemeMode,
} from '../../application/index.ts'
import type { DynamicSchemeColors, StateLayersOption } from '../../ports/index.ts'
import type { EmissiveSchemeOptions } from '../../ports/index.ts'
import { OledDisplayPhysicsSingleton } from './internal/oled-display-physics-adapter.ts'

export interface BuildSchemeOptions {
  mode?: ThemeMode
  variant?: PaletteVariant
  harmonizeSemantics?: boolean
  contrastLevel?: number
  contrastMetric?: ContrastMetric
  ambient?: AmbientSurround
  emissive?: EmissiveSchemeOptions
  gamut?: GamutTarget
  hkCompensation?: boolean
  softKnee?: boolean
  stateLayers?: StateLayersOption
  stateLayersBlendSpace?: StateLayerBlendSpace
  stateLayersContrastGuard?: boolean
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
      ambient: options.ambient,
      emissive: options.emissive,
      stateLayers: options.stateLayers,
      stateLayersBlendSpace: options.stateLayersBlendSpace,
      stateLayersContrastGuard: options.stateLayersContrastGuard,
    },
    OledDisplayPhysicsSingleton
  )
}
