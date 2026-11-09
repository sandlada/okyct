/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer 3: Application Layer Barrel]
 */

export {
  STANDARD_TONES,
  StandardPaletteKeys,
  type StandardTone,
  type StandardPaletteKey,
  type PaletteVariant,
} from '../ports/inbound/palette-generation.port.ts'

export {
  SystemColorTokens,
  type SystemColorToken,
  type DynamicSchemeColors,
  type CustomColorConfig,
  type ResolvedCustomColor,
  type ContrastAuditItem,
  type ThemeMode,
} from '../ports/inbound/scheme-building.port.ts'

export type { EmissiveSchemeOptions } from '../ports/outbound/display-physics.port.ts'

export type {
  ColorLayer,
  LayerStepTrace,
  CompositedResult,
  StackOptions,
  StackedContrastReport,
} from '../ports/inbound/layer-stacking.port.ts'

export * from './tonal-palette.ts'
export * from './palette-set.ts'
export * from './harmonize-hex.ts'
export * from './is-warm-hue.ts'
export * from './create-palettes-from-source.ts'
export * from './palette-generation-use-case.ts'
export * from './scheme-token-role-map.ts'
export * from './build-dynamic-scheme-with-physics.ts'
export * from './resolve-custom-colors.ts'
export * from './audit-scheme-contrast.ts'
export * from './stack-layers.ts'
export * from './stack-state-layers.ts'
export * from './audit-stacked-contrast.ts'
export * from './stack-to-css-color-mix.ts'
export * from './layer-stacking-use-case.ts'
