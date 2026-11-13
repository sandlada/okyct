
import { SystemColorTokens, type DynamicSchemeColors, type ResolvedCustomColor } from '../../ports/index.ts'

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
  customColorsDark: readonly ResolvedCustomColor[] = []
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
    for (const c of customs) {
      group[c.name] = {
        color: { $value: c.color, $type: 'color', $description: `${c.label} base role` },
        onColor: { $value: c.onColor, $type: 'color', $description: `${c.label} foreground text` },
        colorContainer: { $value: c.colorContainer, $type: 'color', $description: `${c.label} tonal container` },
        onColorContainer: { $value: c.onColorContainer, $type: 'color', $description: `${c.label} container text` },
      }
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
