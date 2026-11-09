/**
 * OKYCT 语义角色：原生 buildDynamicSchemeWithPhysics
 */

import {
  buildDynamicSchemeWithPhysics,
  createPalettesFromSource,
  type DynamicSchemeColors,
  type SystemColorToken,
} from '@sandlada/okyct'
import {
  SemanticContrastRoleTokens,
  type SemanticContrastRoleToken,
  type SemanticRoleHexMap,
} from '../semantic-role-contract.ts'

function pickRoleHexMap(scheme: DynamicSchemeColors): SemanticRoleHexMap {
  const map = {} as SemanticRoleHexMap
  for (const token of SemanticContrastRoleTokens) {
    map[token] = scheme[token as SystemColorToken].toUpperCase()
  }
  return map
}

export function generateOkyctSemanticRoles(seedHex: string): {
  light: SemanticRoleHexMap
  dark: SemanticRoleHexMap
} {
  const palettes = createPalettesFromSource(seedHex, 'tonalSpot', true)
  const lightScheme = buildDynamicSchemeWithPhysics(palettes, false, 0, {})
  const darkScheme = buildDynamicSchemeWithPhysics(palettes, true, 0, {})
  return {
    light: pickRoleHexMap(lightScheme),
    dark: pickRoleHexMap(darkScheme),
  }
}
