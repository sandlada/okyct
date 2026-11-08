/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Compatibility Facade -> @sandlada/okyct]
 * 保持前端组件零改动无感兼容，直接转发 @sandlada/okyct 动态配色方案与 OLED 驱动。
 */

export {
  SystemColorTokens,
  type SystemColorToken,
  type SchemeRoleKind,
  type SchemeTokenRoleBinding,
  SchemeTokenRoleMap,
  type DynamicSchemeColors,
  type CustomColorConfig,
  type ResolvedCustomColor,
  type ContrastAuditItem,
  type ThemeMode,
  type EmissiveSchemeOptions,
  buildDynamicSchemeWithPhysics,
  resolveCustomColors,
  auditSchemeContrast,
} from '@sandlada/okyct/application'

export { buildDynamicScheme } from '@sandlada/okyct/adapters'
