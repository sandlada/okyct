/**
 * [Hexagonal Layer: Outbound Port]
 * Multi-format production design token exporter driven contract (one port per file).
 * Constraint: depends only on domain/models and sibling port contracts.
 */

import type { CssColorFormat } from '../../domain/models/index.ts'
import type {
  DynamicSchemeColors,
  ResolvedCustomColor,
  StateLayersOption,
} from '../inbound/scheme-building.port.ts'
import type { PaletteSet, ITonalPalettePort } from '../inbound/palette-generation.port.ts'

export const CssSchemeModes = ['class', 'light-dark'] as const
export type CssSchemeMode = (typeof CssSchemeModes)[number]

export const TailwindFallbackModes = ['none', 'light-dark'] as const
export type TailwindFallbackMode = (typeof TailwindFallbackModes)[number]

export interface ExportTokensBaseOptions {
  customColorsLight?: readonly ResolvedCustomColor[]
  customColorsDark?: readonly ResolvedCustomColor[]
  stateLayers?: StateLayersOption
  colorFormat?: CssColorFormat
}

export interface ExportCssVariablesOptions<
  TPalette extends ITonalPalettePort = ITonalPalettePort,
> extends ExportTokensBaseOptions {
  palettes?: PaletteSet<TPalette>
  schemeMode?: CssSchemeMode
}

export interface ExportTailwindV4Options extends ExportTokensBaseOptions {
  fallback?: TailwindFallbackMode
}

export interface ITokenExporterPort<TPalette extends ITonalPalettePort = ITonalPalettePort> {
  exportCssVariables(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    options?: ExportCssVariablesOptions<TPalette>
  ): string

  exportTailwindV4(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    options?: ExportTailwindV4Options
  ): string

  exportW3cDesignTokens(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    options?: ExportTokensBaseOptions
  ): string

  exportTypeScriptTokens(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    options?: ExportTokensBaseOptions
  ): string
}
