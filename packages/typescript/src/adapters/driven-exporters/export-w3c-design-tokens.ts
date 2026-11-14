
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

interface W3cDesignTokenLeaf {
  $value: string
  $type: 'color'
  $description: string
}

type W3cDesignTokenGroup = Record<string, W3cDesignTokenLeaf | Record<string, W3cDesignTokenLeaf>>

export function exportW3cDesignTokens(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  customColorsLight: readonly ResolvedCustomColor[] = [],
  customColorsDark: readonly ResolvedCustomColor[] = [],
  stateLayers?: StateLayersOption
): string {
  const buildGroup = (scheme: DynamicSchemeColors, customs: readonly ResolvedCustomColor[]): W3cDesignTokenGroup => {
    const group: W3cDesignTokenGroup = {}
    for (const k of SystemColorTokens) {
      group[k] = {
        $value: scheme[k],
        $type: 'color',
        $description: `Material Design 3 system token for ${k}`,
      }
    }
    for (const [stateKey, stateHex] of resolveSystemStateLayersForExport(scheme, stateLayers)) {
      group[stateKey] = {
        $value: stateHex,
        $type: 'color',
        $description: `Pre-composited state layer token for ${stateKey}`,
      }
    }
    for (const c of customs) {
      const { colorStates, onColorStates, containerStates, onContainerStates } =
        resolveCustomStateLayersForExport(c, stateLayers)
      const customEntry: Record<string, W3cDesignTokenLeaf> = {
        color: { $value: c.color, $type: 'color', $description: `${c.label} base role` },
        onColor: { $value: c.onColor, $type: 'color', $description: `${c.label} foreground text` },
        colorContainer: { $value: c.colorContainer, $type: 'color', $description: `${c.label} tonal container` },
        onColorContainer: { $value: c.onColorContainer, $type: 'color', $description: `${c.label} container text` },
      }
      for (const [state, hex] of colorStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        customEntry[`color${cap}`] = {
          $value: hex,
          $type: 'color',
          $description: `${c.label} ${state} state layer`,
        }
      }
      for (const [state, hex] of onColorStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        customEntry[`onColor${cap}`] = {
          $value: hex,
          $type: 'color',
          $description: `${c.label} on-color ${state} state layer`,
        }
      }
      for (const [state, hex] of containerStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        customEntry[`colorContainer${cap}`] = {
          $value: hex,
          $type: 'color',
          $description: `${c.label} container ${state} state layer`,
        }
      }
      for (const [state, hex] of onContainerStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        customEntry[`onColorContainer${cap}`] = {
          $value: hex,
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
