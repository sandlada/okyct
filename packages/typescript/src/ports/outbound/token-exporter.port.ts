/**
 * [Hexagonal Layer: Outbound Port]
 * 多格式生产级设计 Token 导出器被驱动端契约 (一个口对应一个文件)
 * 约束：仅依赖 domain/models 与同层契约
 */

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

export interface ITokenExporterPort<TPalette extends ITonalPalettePort = ITonalPalettePort> {
  exportCssVariables(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    palettes?: PaletteSet<TPalette>,
    customColorsLight?: readonly ResolvedCustomColor[],
    customColorsDark?: readonly ResolvedCustomColor[],
    schemeMode?: CssSchemeMode,
    stateLayers?: StateLayersOption
  ): string

  exportTailwindV4(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    customColorsLight?: readonly ResolvedCustomColor[],
    customColorsDark?: readonly ResolvedCustomColor[],
    fallback?: TailwindFallbackMode,
    stateLayers?: StateLayersOption
  ): string

  exportW3cDesignTokens(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    customColorsLight?: readonly ResolvedCustomColor[],
    customColorsDark?: readonly ResolvedCustomColor[],
    stateLayers?: StateLayersOption
  ): string

  exportTypeScriptTokens(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    customColorsLight?: readonly ResolvedCustomColor[],
    customColorsDark?: readonly ResolvedCustomColor[],
    stateLayers?: StateLayersOption
  ): string
}
