import {
  SystemColorTokens,
  type DynamicSchemeColors,
  type ExportTokensBaseOptions,
  type ResolvedCustomColor,
} from '../../ports/index.ts'
import type { CssColorFormat } from '../../domain/index.ts'
import { formatColorValue, formatSchemeToken, resolveExportColorFormat } from './internal/format-export-color.ts'
import { registerTokenKey } from './internal/assert-no-token-collision.ts'
import {
  resolveCustomStateLayersForExport,
  resolveSystemStateLayersForExport,
} from './internal/resolve-export-state-layers.ts'
import { serializeCanonicalJson } from './internal/serialize-canonical-json.ts'

function extractTokens(
  scheme: DynamicSchemeColors,
  colorFormat: CssColorFormat,
  stateLayers?: ExportTokensBaseOptions['stateLayers']
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of SystemColorTokens) {
    result[key] = formatSchemeToken(scheme, key, colorFormat)
  }
  for (const [stateKey, stateHex] of resolveSystemStateLayersForExport(scheme, stateLayers)) {
    result[stateKey] = formatColorValue(stateHex, colorFormat)
  }
  return result
}

export function exportTypeScriptTokens(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  options: ExportTokensBaseOptions = {}
): string {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid exportTypeScriptTokens options: expected an object.')
  }

  const {
    customColorsLight = [],
    customColorsDark = [],
    stateLayers,
  } = options
  const colorFormat = resolveExportColorFormat(options.colorFormat)

  const buildCustomMap = (customs: readonly ResolvedCustomColor[]) => {
    const res: Record<string, Record<string, string>> = {}
    const customKeys = new Map<string, string>()
    const fmt = (hex: string) => formatColorValue(hex, colorFormat)
    for (const c of customs) {
      registerTokenKey(customKeys, c.name, `custom color "${c.name}"`, 'exportTypeScriptTokens')
      const entry: Record<string, string> = {
        color: fmt(c.color),
        onColor: fmt(c.onColor),
        colorContainer: fmt(c.colorContainer),
        onColorContainer: fmt(c.onColorContainer),
      }
      const { colorStates, onColorStates, containerStates, onContainerStates } =
        resolveCustomStateLayersForExport(c, stateLayers)
      for (const [state, hex] of colorStates) {
        entry[`color${state.charAt(0).toUpperCase()}${state.slice(1)}`] = fmt(hex)
      }
      for (const [state, hex] of onColorStates) {
        entry[`onColor${state.charAt(0).toUpperCase()}${state.slice(1)}`] = fmt(hex)
      }
      for (const [state, hex] of containerStates) {
        entry[`colorContainer${state.charAt(0).toUpperCase()}${state.slice(1)}`] = fmt(hex)
      }
      for (const [state, hex] of onContainerStates) {
        entry[`onColorContainer${state.charAt(0).toUpperCase()}${state.slice(1)}`] = fmt(hex)
      }
      res[c.name] = entry
    }
    return res
  }

  const lightJson = serializeCanonicalJson({
    ...extractTokens(lightScheme, colorFormat, stateLayers),
    custom: buildCustomMap(customColorsLight),
  })
  const darkJson = serializeCanonicalJson({
    ...extractTokens(darkScheme, colorFormat, stateLayers),
    custom: buildCustomMap(customColorsDark),
  })

  return (
    '/**\n * OKYCT Typed Color Tokens\n */\n\n' +
    `export const LightThemeTokens = ${lightJson} as const\n\n` +
    `export const DarkThemeTokens = ${darkJson} as const\n\n` +
    'export type ThemeColors = typeof LightThemeTokens\n'
  )
}
