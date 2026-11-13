import { hexToOkyct, type ContrastMetric, type GamutTarget, type OKYCT } from '../domain/index.ts'
import {
  ThemeModes,
  auditSchemeContrast,
  createPalettesFromSource,
  resolveCustomColors,
  type ContrastAuditItem,
  type CustomColorInput,
  type DynamicSchemeColors,
  type EmissiveSchemeOptions,
  type PaletteSet,
  type PaletteVariant,
  type ResolvedCustomColor,
  type ThemeMode,
} from '../application/index.ts'
import type { SchemeEmissiveReport } from '../ports/outbound/display-physics.port.ts'
import { analyzeEmissiveSchemeMetrics, buildDynamicScheme } from './driven-emissive-oled/index.ts'
import {
  exportTheme,
  type ExportThemeOptions,
  type TokenExportFormat,
} from './driven-exporters/index.ts'
import { toTokenDictionary, type TokenDictionary } from './driving-fp/index.ts'

export interface CreateThemeOptions {
  sourceHex: string
  variant?: PaletteVariant
  harmonizeSemantics?: boolean
  contrastLevel?: number
  contrastMetric?: ContrastMetric
  gamut?: GamutTarget
  hkCompensation?: boolean
  softKnee?: boolean
  emissive?: EmissiveSchemeOptions
  customColors?: readonly CustomColorInput[] | Record<string, string>
}

export interface OkyctTheme {
  readonly sourceHex: string
  readonly sourceOkyct: OKYCT
  readonly variant: PaletteVariant
  readonly contrastLevel: number
  readonly contrastMetric: ContrastMetric
  readonly emissive: Required<EmissiveSchemeOptions>
  readonly palettes: PaletteSet
  readonly schemes: {
    readonly light: DynamicSchemeColors
    readonly dark: DynamicSchemeColors
  }
  readonly customColors: {
    readonly light: ResolvedCustomColor[]
    readonly dark: ResolvedCustomColor[]
  }
  scheme(mode?: ThemeMode): DynamicSchemeColors
  tokens(mode?: ThemeMode, options?: { includeCustomColors?: boolean }): TokenDictionary
  auditContrast(mode?: ThemeMode): ContrastAuditItem[]
  analyzeEmissive(mode?: ThemeMode): SchemeEmissiveReport
  export(format?: TokenExportFormat, options?: Omit<ExportThemeOptions, 'format'>): string
}

function assertThemeMode(mode: ThemeMode): ThemeMode {
  if (!ThemeModes.includes(mode)) {
    throw new Error(`Invalid theme mode: "${String(mode)}". Expected one of: ${ThemeModes.join(', ')}.`)
  }
  return mode
}

function normalizeCustomColorInputs(
  customColors?: readonly CustomColorInput[] | Record<string, string>
): CustomColorInput[] {
  if (customColors === undefined) return []
  if (Array.isArray(customColors)) return [...customColors]
  if (customColors !== null && typeof customColors === 'object') {
    return Object.entries(customColors).map(([name, sourceHex]) => ({
      name,
      sourceHex,
    }))
  }
  throw new Error('Invalid customColors option: expected an array of CustomColorInput or a Record<string, string>.')
}

export function createTheme(sourceOrOptions: string | CreateThemeOptions): OkyctTheme {
  if (
    typeof sourceOrOptions !== 'string' &&
    (sourceOrOptions === null || typeof sourceOrOptions !== 'object' || Array.isArray(sourceOrOptions))
  ) {
    throw new Error('Invalid createTheme input: expected a hex color string or CreateThemeOptions object.')
  }

  const opts: CreateThemeOptions =
    typeof sourceOrOptions === 'string'
      ? { sourceHex: sourceOrOptions }
      : sourceOrOptions

  const sourceHex = opts.sourceHex
  const sourceOkyct = hexToOkyct(sourceHex)
  const variant: PaletteVariant = opts.variant ?? 'tonalSpot'
  if (opts.harmonizeSemantics !== undefined && typeof opts.harmonizeSemantics !== 'boolean') {
    throw new Error('Invalid harmonizeSemantics option: expected a boolean.')
  }
  const harmonizeSemantics = opts.harmonizeSemantics ?? true

  const rawContrast = opts.contrastLevel ?? 0.0
  if (!Number.isFinite(rawContrast)) {
    throw new Error(`Invalid contrastLevel: ${rawContrast}. Expected a finite number in [-1.0, 1.0].`)
  }
  const contrastLevel = Math.max(-1.0, Math.min(1.0, rawContrast))
  const contrastMetric: ContrastMetric = opts.contrastMetric ?? 'both'

  if (
    opts.emissive !== undefined &&
    (opts.emissive === null || typeof opts.emissive !== 'object' || Array.isArray(opts.emissive))
  ) {
    throw new Error('Invalid emissive option: expected an EmissiveSchemeOptions object.')
  }

  const emissive: Required<EmissiveSchemeOptions> = {
    profile: opts.emissive?.profile ?? 'standard-lcd',
    burnInGuard: opts.emissive?.burnInGuard ?? false,
    antiFringing: opts.emissive?.antiFringing ?? false,
  }

  const palettes = createPalettesFromSource(sourceHex, {
    variant,
    harmonizeSemantics,
    gamut: opts.gamut,
    hkCompensation: opts.hkCompensation,
    softKnee: opts.softKnee,
  })
  const lightScheme = buildDynamicScheme(palettes, {
    mode: 'light',
    contrastLevel,
    contrastMetric,
    emissive,
  })
  const darkScheme = buildDynamicScheme(palettes, {
    mode: 'dark',
    contrastLevel,
    contrastMetric,
    emissive,
  })

  const customConfigs = normalizeCustomColorInputs(opts.customColors)
  const customLight =
    customConfigs.length > 0
      ? resolveCustomColors(customConfigs, sourceHex, {
          mode: 'light',
          contrastLevel,
          contrastMetric,
        })
      : []
  const customDark =
    customConfigs.length > 0
      ? resolveCustomColors(customConfigs, sourceHex, {
          mode: 'dark',
          contrastLevel,
          contrastMetric,
        })
      : []

  return {
    sourceHex,
    sourceOkyct,
    variant,
    contrastLevel,
    contrastMetric,
    emissive,
    palettes,
    schemes: {
      light: lightScheme,
      dark: darkScheme,
    },
    customColors: {
      light: customLight,
      dark: customDark,
    },
    scheme(mode: ThemeMode = 'dark'): DynamicSchemeColors {
      return assertThemeMode(mode) === 'dark' ? darkScheme : lightScheme
    },
    tokens(
      mode: ThemeMode = 'dark',
      tokenOptions: { includeCustomColors?: boolean } = {}
    ): TokenDictionary {
      const resolvedMode = assertThemeMode(mode)
      const targetScheme = resolvedMode === 'dark' ? darkScheme : lightScheme
      const targetCustom =
        tokenOptions.includeCustomColors === false
          ? []
          : resolvedMode === 'dark'
          ? customDark
          : customLight
      return toTokenDictionary(targetScheme, targetCustom)
    },
    auditContrast(mode: ThemeMode = 'dark'): ContrastAuditItem[] {
      return auditSchemeContrast(assertThemeMode(mode) === 'dark' ? darkScheme : lightScheme)
    },
    analyzeEmissive(mode: ThemeMode = 'dark'): SchemeEmissiveReport {
      return analyzeEmissiveSchemeMetrics(
        assertThemeMode(mode) === 'dark' ? darkScheme : lightScheme,
        emissive.profile
      )
    },
    export(
      format: TokenExportFormat = 'css',
      exportOptions: Omit<ExportThemeOptions, 'format'> = {}
    ): string {
      return exportTheme(
        {
          lightScheme,
          darkScheme,
          palettes,
          customColorsLight: customLight,
          customColorsDark: customDark,
        },
        { ...exportOptions, format }
      )
    },
  }
}
