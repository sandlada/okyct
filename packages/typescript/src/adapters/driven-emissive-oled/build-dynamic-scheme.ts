import {
  ThemeModes,
  buildDynamicSchemeWithPhysics,
  createPalettesFromSource,
  type PaletteSet,
  type PaletteVariant,
  type ThemeMode,
} from '../../application/index.ts'
import type { DynamicSchemeColors } from '../../ports/inbound/scheme-building.port.ts'
import type {
  EmissivePanelType,
  EmissiveSchemeOptions,
} from '../../ports/outbound/display-physics.port.ts'
import { OledDisplayPhysicsSingleton } from './internal/oled-display-physics-adapter.ts'

export interface BuildSchemeOptions {
  mode?: ThemeMode
  isDark?: boolean
  variant?: PaletteVariant
  harmonizeSemantics?: boolean
  contrastLevel?: number
  emissive?: EmissiveSchemeOptions
  profile?: EmissivePanelType
  burnInGuard?: boolean
  antiFringing?: boolean
}

export function buildDynamicScheme(
  sourceOrPalettes: string | PaletteSet,
  options?: BuildSchemeOptions
): DynamicSchemeColors
export function buildDynamicScheme(
  palettes: PaletteSet,
  isDark: boolean,
  contrastLevel?: number,
  emissiveOptions?: EmissiveSchemeOptions
): DynamicSchemeColors
export function buildDynamicScheme(
  sourceOrPalettes: string | PaletteSet,
  isDarkOrOptions: boolean | BuildSchemeOptions = {},
  contrastLevel = 0.0,
  emissiveOptions: EmissiveSchemeOptions = {}
): DynamicSchemeColors {
  if (typeof isDarkOrOptions === 'boolean') {
    const palettes =
      typeof sourceOrPalettes === 'string'
        ? createPalettesFromSource(sourceOrPalettes)
        : sourceOrPalettes
    return buildDynamicSchemeWithPhysics(
      palettes,
      isDarkOrOptions,
      contrastLevel,
      emissiveOptions,
      OledDisplayPhysicsSingleton
    )
  }

  if (isDarkOrOptions === null || typeof isDarkOrOptions !== 'object' || Array.isArray(isDarkOrOptions)) {
    throw new Error('Invalid buildDynamicScheme options: expected a boolean or BuildSchemeOptions object.')
  }

  const opts = isDarkOrOptions
  if (opts.mode !== undefined && !ThemeModes.includes(opts.mode)) {
    throw new Error(`Invalid theme mode: "${String(opts.mode)}". Expected one of: ${ThemeModes.join(', ')}.`)
  }

  const palettes =
    typeof sourceOrPalettes === 'string'
      ? createPalettesFromSource(
          sourceOrPalettes,
          opts.variant ?? 'tonalSpot',
          opts.harmonizeSemantics ?? true
        )
      : sourceOrPalettes

  const isDark = opts.isDark ?? (opts.mode === 'dark')
  const resolvedContrast = opts.contrastLevel ?? 0.0
  const resolvedEmissive: EmissiveSchemeOptions = opts.emissive ?? {
    profile: opts.profile,
    burnInGuard: opts.burnInGuard,
    antiFringing: opts.antiFringing,
  }

  return buildDynamicSchemeWithPhysics(
    palettes,
    isDark,
    resolvedContrast,
    resolvedEmissive,
    OledDisplayPhysicsSingleton
  )
}
