/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SystemColorTokens,
  type SystemColorToken,
  type DynamicSchemeColors,
  type ResolvedCustomColor,
} from '../../ports/index.ts'

function stripTones(scheme: DynamicSchemeColors): Record<SystemColorToken, string> {
  const result = {} as Record<SystemColorToken, string>
  for (const key of SystemColorTokens) {
    result[key] = scheme[key]
  }
  return result
}

export function exportTypeScriptTokens(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  customColorsLight: ResolvedCustomColor[] = [],
  customColorsDark: ResolvedCustomColor[] = []
): string {
  const buildCustomMap = (customs: ResolvedCustomColor[]) => {
    const res: Record<string, { color: string; onColor: string; colorContainer: string; onColorContainer: string }> = {}
    for (const c of customs) {
      res[c.name] = {
        color: c.color,
        onColor: c.onColor,
        colorContainer: c.colorContainer,
        onColorContainer: c.onColorContainer,
      }
    }
    return res
  }

  return `/**
 * OKYCT Typed Color Tokens
 */

export const LightThemeTokens = ${JSON.stringify(
    { ...stripTones(lightScheme), custom: buildCustomMap(customColorsLight) },
    null,
    2
  )} as const

export const DarkThemeTokens = ${JSON.stringify(
    { ...stripTones(darkScheme), custom: buildCustomMap(customColorsDark) },
    null,
    2
  )} as const

export type ThemeColors = typeof LightThemeTokens
`
}
