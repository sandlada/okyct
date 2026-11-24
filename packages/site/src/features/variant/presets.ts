import { hexToOkyct } from '../../color/math.ts'
import {
  TonalPalette,
  harmonizeHex,
  isWarmHue,
  type PaletteSet,
  type PaletteVariant,
} from '../../color/palettes.ts'

export const VariantEditableRoles = [
  'primary',
  'secondary',
  'tertiary',
  'neutral',
  'neutralVariant',
] as const

export type VariantEditableRole = (typeof VariantEditableRoles)[number]

export interface VariantRoleOffsetConfig {
  readonly hueOffset: number
  readonly chromaScale: number
  readonly chromaMin: number
  readonly chromaMax: number
}

export type VariantRoleMap = Record<VariantEditableRole, VariantRoleOffsetConfig>

export interface ResolvedVariantRoleCoord {
  readonly role: VariantEditableRole
  readonly hueOffset: number
  readonly hue: number
  readonly chroma: number
}

const BaseNeutralChroma = 0.014
const WarmNeutralChroma = 0.012
const NeutralVariantRatio = 2.2

export function createPresetRoleMap(
  variant: PaletteVariant,
  warmHue = false
): VariantRoleMap {
  const neutralBase = warmHue ? WarmNeutralChroma : BaseNeutralChroma
  const neutralVarBase = neutralBase * NeutralVariantRatio

  switch (variant) {
    case 'vibrant':
      return {
        primary: { hueOffset: 0, chromaScale: 1, chromaMin: 0.12, chromaMax: 0.4 },
        secondary: { hueOffset: 25, chromaScale: 0.7, chromaMin: 0.08, chromaMax: 0.4 },
        tertiary: { hueOffset: 60, chromaScale: 0.85, chromaMin: 0.1, chromaMax: 0.4 },
        neutral: { hueOffset: 0, chromaScale: 0, chromaMin: neutralBase * 1.5, chromaMax: neutralBase * 1.5 },
        neutralVariant: { hueOffset: 0, chromaScale: 0, chromaMin: neutralVarBase * 1.3, chromaMax: neutralVarBase * 1.3 },
      }
    case 'expressive':
      return {
        primary: { hueOffset: 0, chromaScale: 1, chromaMin: 0.1, chromaMax: 0.4 },
        secondary: { hueOffset: 90, chromaScale: 0.65, chromaMin: 0.07, chromaMax: 0.4 },
        tertiary: { hueOffset: 180, chromaScale: 0.8, chromaMin: 0.09, chromaMax: 0.4 },
        neutral: { hueOffset: 15, chromaScale: 0, chromaMin: neutralBase * 1.4, chromaMax: neutralBase * 1.4 },
        neutralVariant: { hueOffset: 15, chromaScale: 0, chromaMin: neutralVarBase * 1.3, chromaMax: neutralVarBase * 1.3 },
      }
    case 'neutral':
      return {
        primary: { hueOffset: 0, chromaScale: 0.6, chromaMin: 0, chromaMax: 0.08 },
        secondary: { hueOffset: 0, chromaScale: 0.35, chromaMin: 0, chromaMax: 0.04 },
        tertiary: { hueOffset: 40, chromaScale: 0.45, chromaMin: 0, chromaMax: 0.05 },
        neutral: { hueOffset: 0, chromaScale: 0, chromaMin: neutralBase * 0.8, chromaMax: neutralBase * 0.8 },
        neutralVariant: { hueOffset: 0, chromaScale: 0, chromaMin: neutralVarBase * 0.8, chromaMax: neutralVarBase * 0.8 },
      }
    case 'monochrome':
      return {
        primary: { hueOffset: 0, chromaScale: 0, chromaMin: 0, chromaMax: 0 },
        secondary: { hueOffset: 0, chromaScale: 0, chromaMin: 0, chromaMax: 0 },
        tertiary: { hueOffset: 0, chromaScale: 0, chromaMin: 0, chromaMax: 0 },
        neutral: { hueOffset: 0, chromaScale: 0, chromaMin: 0, chromaMax: 0 },
        neutralVariant: { hueOffset: 0, chromaScale: 0, chromaMin: 0, chromaMax: 0 },
      }
    case 'fidelity':
      return {
        primary: { hueOffset: 0, chromaScale: 1, chromaMin: 0, chromaMax: 0.4 },
        secondary: { hueOffset: 15, chromaScale: 0.5, chromaMin: 0, chromaMax: 0.4 },
        tertiary: { hueOffset: 30, chromaScale: 0.7, chromaMin: 0, chromaMax: 0.4 },
        neutral: { hueOffset: 0, chromaScale: 0, chromaMin: neutralBase, chromaMax: neutralBase },
        neutralVariant: { hueOffset: 0, chromaScale: 0, chromaMin: neutralVarBase, chromaMax: neutralVarBase },
      }
    case 'tonalSpot':
    default:
      return {
        primary: { hueOffset: 0, chromaScale: 1, chromaMin: 0.09, chromaMax: 0.18 },
        secondary: { hueOffset: 15, chromaScale: 0.45, chromaMin: 0.04, chromaMax: 0.4 },
        tertiary: { hueOffset: 60, chromaScale: 0.65, chromaMin: 0.06, chromaMax: 0.4 },
        neutral: { hueOffset: 0, chromaScale: 0, chromaMin: neutralBase, chromaMax: neutralBase },
        neutralVariant: { hueOffset: 0, chromaScale: 0, chromaMin: neutralVarBase, chromaMax: neutralVarBase },
      }
  }
}

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

export function resolveRoleCoordinate(
  sourceHue: number,
  sourceChroma: number,
  role: VariantEditableRole,
  config: VariantRoleOffsetConfig
): ResolvedVariantRoleCoord {
  const hue = normalizeHue(sourceHue + config.hueOffset)
  const minC = Math.max(0, Math.min(config.chromaMin, config.chromaMax))
  const maxC = Math.max(minC, config.chromaMax)
  const scaled = Math.max(0, sourceChroma * config.chromaScale)
  const chroma = Math.max(minC, Math.min(maxC, scaled))
  return {
    role,
    hueOffset: config.hueOffset,
    hue,
    chroma,
  }
}

export function resolveAllRoleCoordinates(
  sourceHex: string,
  roles: VariantRoleMap
): Record<VariantEditableRole, ResolvedVariantRoleCoord> {
  const source = hexToOkyct(sourceHex)
  const seedChroma = Math.max(0.04, source.c)
  return {
    primary: resolveRoleCoordinate(source.h, seedChroma, 'primary', roles.primary),
    secondary: resolveRoleCoordinate(source.h, seedChroma, 'secondary', roles.secondary),
    tertiary: resolveRoleCoordinate(source.h, seedChroma, 'tertiary', roles.tertiary),
    neutral: resolveRoleCoordinate(source.h, seedChroma, 'neutral', roles.neutral),
    neutralVariant: resolveRoleCoordinate(source.h, seedChroma, 'neutralVariant', roles.neutralVariant),
  }
}

export function isSourceWarmHue(sourceHex: string): boolean {
  return isWarmHue(hexToOkyct(sourceHex).h)
}

export function buildCustomPaletteSet(
  sourceHex: string,
  roles: VariantRoleMap,
  harmonizeSemantics = true
): PaletteSet {
  const coords = resolveAllRoleCoordinates(sourceHex, roles)

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

  return {
    primary: new TonalPalette(coords.primary.hue, coords.primary.chroma),
    secondary: new TonalPalette(coords.secondary.hue, coords.secondary.chroma),
    tertiary: new TonalPalette(coords.tertiary.hue, coords.tertiary.chroma),
    neutral: new TonalPalette(coords.neutral.hue, coords.neutral.chroma),
    neutralVariant: new TonalPalette(coords.neutralVariant.hue, coords.neutralVariant.chroma),
    error: TonalPalette.fromHex(errorHex),
    warning: TonalPalette.fromHex(warningHex),
    success: TonalPalette.fromHex(successHex),
    info: TonalPalette.fromHex(infoHex),
  }
}
