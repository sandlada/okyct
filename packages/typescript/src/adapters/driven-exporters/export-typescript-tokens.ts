
import {
  SystemColorTokens,
  type DynamicSchemeColors,
  type ResolvedCustomColor,
  type StateLayersOption,
} from '../../ports/index.ts'
import {
  resolveCustomStateLayersForExport,
  resolveSystemStateLayersForExport,
} from './internal/resolve-export-state-layers.ts'

function extractTokens(
  scheme: DynamicSchemeColors,
  stateLayers?: StateLayersOption
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of SystemColorTokens) {
    result[key] = scheme[key]
  }
  for (const [stateKey, stateHex] of resolveSystemStateLayersForExport(scheme, stateLayers)) {
    result[stateKey] = stateHex
  }
  return result
}

export function exportTypeScriptTokens(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  customColorsLight: readonly ResolvedCustomColor[] = [],
  customColorsDark: readonly ResolvedCustomColor[] = [],
  stateLayers?: StateLayersOption
): string {
  const buildCustomMap = (customs: readonly ResolvedCustomColor[]) => {
    const res: Record<string, Record<string, string>> = {}
    for (const c of customs) {
      const entry: Record<string, string> = {
        color: c.color,
        onColor: c.onColor,
        colorContainer: c.colorContainer,
        onColorContainer: c.onColorContainer,
      }
      const { colorStates, onColorStates, containerStates, onContainerStates } =
        resolveCustomStateLayersForExport(c, stateLayers)
      for (const [state, hex] of colorStates) {
        entry[`color${state.charAt(0).toUpperCase()}${state.slice(1)}`] = hex
      }
      for (const [state, hex] of onColorStates) {
        entry[`onColor${state.charAt(0).toUpperCase()}${state.slice(1)}`] = hex
      }
      for (const [state, hex] of containerStates) {
        entry[`colorContainer${state.charAt(0).toUpperCase()}${state.slice(1)}`] = hex
      }
      for (const [state, hex] of onContainerStates) {
        entry[`onColorContainer${state.charAt(0).toUpperCase()}${state.slice(1)}`] = hex
      }
      res[c.name] = entry
    }
    return res
  }

  return `/**
 * OKYCT Typed Color Tokens
 */

export const LightThemeTokens = ${JSON.stringify(
    { ...extractTokens(lightScheme, stateLayers), custom: buildCustomMap(customColorsLight) },
    null,
    2
  )} as const

export const DarkThemeTokens = ${JSON.stringify(
    { ...extractTokens(darkScheme, stateLayers), custom: buildCustomMap(customColorsDark) },
    null,
    2
  )} as const

export type ThemeColors = typeof LightThemeTokens
`
}
