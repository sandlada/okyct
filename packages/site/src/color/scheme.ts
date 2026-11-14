/**
 * [Compatibility Facade -> @sandlada/okyct]
 * 保持前端组件零改动无感兼容，直接转发 @sandlada/okyct 动态配色方案与 OLED 驱动。
 */

export {
  SystemColorTokens,
  StateLayerStates,
  StatefulSystemColorTokens,
  type SystemColorToken,
  type StateLayerState,
  type StateLayersOption,
  type StatefulSystemColorToken,
  type SystemStateLayerToken,
  type SchemeStateLayerTokens,
  type DynamicSchemeColors,
  type CustomColorConfig,
  type ResolvedCustomColor,
  type ContrastAuditItem,
  type ThemeMode,
  type EmissiveSchemeOptions,
  resolveCustomColors,
  resolveSchemeStateLayers,
  auditSchemeContrast,
} from '@sandlada/okyct/application'

export {
  buildDynamicScheme,
  createTheme,
  type BuildSchemeOptions,
  type CreateThemeOptions,
  type OkyctTheme,
} from '@sandlada/okyct/adapters'
