import type {
  CssSchemeMode,
  DynamicSchemeColors,
  ResolvedCustomColor,
  StateLayersOption,
  TailwindFallbackMode,
} from '../../ports/index.ts'
import {
  createPalettesFromSource,
  type PaletteSet,
  type PaletteVariant,
} from '../../application/index.ts'
import type { OkyctTheme } from '../create-theme.ts'
import { exportCssVariables } from './export-css-variables.ts'
import { exportTailwindV4 } from './export-tailwind-v4.ts'
import { exportW3cDesignTokens } from './export-w3c-design-tokens.ts'
import { exportTypeScriptTokens } from './export-typescript-tokens.ts'

export const TokenExportFormats = ['css', 'tailwind', 'w3c', 'ts'] as const
export type TokenExportFormat = (typeof TokenExportFormats)[number]

export interface ExportThemeInput {
  lightScheme: DynamicSchemeColors
  darkScheme: DynamicSchemeColors
  palettes?: PaletteSet
  sourceHex?: string
  variant?: PaletteVariant
  harmonizeSemantics?: boolean
  customColorsLight?: readonly ResolvedCustomColor[]
  customColorsDark?: readonly ResolvedCustomColor[]
}

export interface ExportThemeOptions {
  format?: TokenExportFormat
  cssSchemeMode?: CssSchemeMode
  tailwindFallback?: TailwindFallbackMode
  stateLayers?: StateLayersOption
}

function isOkyctTheme(input: ExportThemeInput | OkyctTheme): input is OkyctTheme {
  return 'schemes' in input && input.schemes !== null && typeof input.schemes === 'object'
}

export function exportTheme(
  input: ExportThemeInput | OkyctTheme,
  options: ExportThemeOptions = {}
): string {
  if (input === null || typeof input !== 'object') {
    throw new Error('Invalid exportTheme input: expected an OkyctTheme or ExportThemeInput object.')
  }

  const format = options.format ?? 'css'
  if (!TokenExportFormats.includes(format)) {
    throw new Error(`Unknown export format: "${String(format)}". Expected one of: ${TokenExportFormats.join(', ')}.`)
  }

  const isTheme = isOkyctTheme(input)
  const lightScheme = isTheme ? input.schemes.light : input.lightScheme
  const darkScheme = isTheme ? input.schemes.dark : input.darkScheme
  if (!lightScheme || !darkScheme) {
    throw new Error('Invalid exportTheme input: both lightScheme and darkScheme are required.')
  }

  const palettes = isTheme
    ? input.palettes
    : input.palettes ?? (
        input.sourceHex !== undefined
          ? createPalettesFromSource(input.sourceHex, {
              variant: input.variant,
              harmonizeSemantics: input.harmonizeSemantics,
            })
          : undefined
      )
  const customLight = isTheme ? (input.customColors?.light ?? []) : (input.customColorsLight ?? [])
  const customDark = isTheme ? (input.customColors?.dark ?? []) : (input.customColorsDark ?? [])

  switch (format) {
    case 'css':
      return exportCssVariables(
        lightScheme,
        darkScheme,
        palettes,
        customLight,
        customDark,
        options.cssSchemeMode ?? 'light-dark',
        options.stateLayers
      )
    case 'tailwind':
      return exportTailwindV4(
        lightScheme,
        darkScheme,
        customLight,
        customDark,
        options.tailwindFallback ?? 'light-dark',
        options.stateLayers
      )
    case 'w3c':
      return exportW3cDesignTokens(
        lightScheme,
        darkScheme,
        customLight,
        customDark,
        options.stateLayers
      )
    case 'ts':
      return exportTypeScriptTokens(
        lightScheme,
        darkScheme,
        customLight,
        customDark,
        options.stateLayers
      )
    default: {
      const unknownFormat: never = format
      throw new Error(`Unknown export format: ${String(unknownFormat)}`)
    }
  }
}
