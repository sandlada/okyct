/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemColorTokens, type DynamicSchemeColors, type ResolvedCustomColor } from '../../ports/index.ts'

export function exportW3cDesignTokens(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  customColorsLight: ResolvedCustomColor[] = [],
  customColorsDark: ResolvedCustomColor[] = []
): string {
  const buildGroup = (scheme: DynamicSchemeColors, customs: ResolvedCustomColor[]) => {
    const group: Record<string, any> = {}
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
