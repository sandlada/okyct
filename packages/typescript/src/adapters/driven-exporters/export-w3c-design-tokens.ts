import {
  SystemColorTokens,
  type DynamicSchemeColors,
  type ExportTokensBaseOptions,
  type ResolvedCustomColor,
} from '../../ports/index.ts'
import { formatColorValue, formatSchemeToken, resolveExportColorFormat } from './internal/format-export-color.ts'
import {
  resolveCustomStateLayersForExport,
  resolveSystemStateLayersForExport,
} from './internal/resolve-export-state-layers.ts'

export type { ExportTokensBaseOptions }

interface W3cDesignTokenLeaf {
  $value: string
  $type: 'color'
  $description: string
}

type W3cDesignTokenGroup = Record<string, W3cDesignTokenLeaf | Record<string, W3cDesignTokenLeaf>>

export function exportW3cDesignTokens(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  options: ExportTokensBaseOptions = {}
): string {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid exportW3cDesignTokens options: expected an object.')
  }

  const {
    customColorsLight = [],
    customColorsDark = [],
    stateLayers,
  } = options
  const colorFormat = resolveExportColorFormat(options.colorFormat)

  const buildGroup = (scheme: DynamicSchemeColors, customs: readonly ResolvedCustomColor[]): W3cDesignTokenGroup => {
    const group: W3cDesignTokenGroup = {}
    for (const k of SystemColorTokens) {
      group[k] = {
        $value: formatSchemeToken(scheme, k, colorFormat),
        $type: 'color',
        $description: `Material Design 3 system token for ${k}`,
      }
    }
    for (const [stateKey, stateHex] of resolveSystemStateLayersForExport(scheme, stateLayers)) {
      group[stateKey] = {
        $value: formatColorValue(stateHex, colorFormat),
        $type: 'color',
        $description: `Pre-composited state layer token for ${stateKey}`,
      }
    }
    for (const c of customs) {
      const { colorStates, onColorStates, containerStates, onContainerStates } =
        resolveCustomStateLayersForExport(c, stateLayers)
      const fmt = (hex: string) => formatColorValue(hex, colorFormat)
      const customEntry: Record<string, W3cDesignTokenLeaf> = {
        color: { $value: fmt(c.color), $type: 'color', $description: `${c.label} base role` },
        onColor: { $value: fmt(c.onColor), $type: 'color', $description: `${c.label} foreground text` },
        colorContainer: { $value: fmt(c.colorContainer), $type: 'color', $description: `${c.label} tonal container` },
        onColorContainer: { $value: fmt(c.onColorContainer), $type: 'color', $description: `${c.label} container text` },
      }
      for (const [state, hex] of colorStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        customEntry[`color${cap}`] = {
          $value: fmt(hex),
          $type: 'color',
          $description: `${c.label} ${state} state layer`,
        }
      }
      for (const [state, hex] of onColorStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        customEntry[`onColor${cap}`] = {
          $value: fmt(hex),
          $type: 'color',
          $description: `${c.label} on-color ${state} state layer`,
        }
      }
      for (const [state, hex] of containerStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        customEntry[`colorContainer${cap}`] = {
          $value: fmt(hex),
          $type: 'color',
          $description: `${c.label} container ${state} state layer`,
        }
      }
      for (const [state, hex] of onContainerStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        customEntry[`onColorContainer${cap}`] = {
          $value: fmt(hex),
          $type: 'color',
          $description: `${c.label} container on-color ${state} state layer`,
        }
      }
      group[c.name] = customEntry
    }
    return group
  }

  const tokens = {
    color: {
      light: buildGroup(lightScheme, customColorsLight),
      dark: buildGroup(darkScheme, customColorsDark),
    },
  }

  return JSON.stringify(tokens, null, 2)
}
