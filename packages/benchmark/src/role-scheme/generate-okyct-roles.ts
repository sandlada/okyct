/**
 * OKYCT 语义角色：原生 createTheme / buildDynamicScheme
 */

import {
  createTheme,
  type DynamicSchemeColors,
  type SystemColorToken,
} from '@sandlada/okyct'
import {
  SemanticContrastRoleTokens,
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
  const theme = createTheme(seedHex)
  return {
    light: pickRoleHexMap(theme.schemes.light),
    dark: pickRoleHexMap(theme.schemes.dark),
  }
}
