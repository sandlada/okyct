/**
 * OKYCT Color Engine — Unified Ergonomic Public Entry
 *
 * Hexagonal / Ports & Adapters layers:
 * - Layer 1: ./domain       (Pure colorimetric math & contrast solvers)
 * - Layer 2: ./ports        (Inbound & outbound contract boundaries)
 * - Layer 3: ./application  (Palettes, dynamic MD3 schemes, and layer stacking)
 * - Layer 4: ./adapters     (Theme builder, OLED physics, exporters, image quantizer, FP combinators)
 */

// 1. Theme building, dynamic schemes & tonal palettes
export {
  createTheme,
  type CreateThemeOptions,
  type OkyctTheme,
  buildDynamicScheme,
  type BuildSchemeOptions,
  exportTheme,
  TokenExportFormats,
  type TokenExportFormat,
  type ExportThemeInput,
  type ExportThemeOptions,
  exportCssVariables,
  exportTailwindV4,
  exportW3cDesignTokens,
  exportTypeScriptTokens,
  CssSchemeModes,
  TailwindFallbackModes,
  type CssSchemeMode,
  type TailwindFallbackMode,
} from './adapters/index.ts'

export {
  TonalPalette,
  createPalettesFromSource,
  resolveCustomColors,
  auditSchemeContrast,
  harmonizeHex,
  isWarmHue,
  StandardTones,
  PaletteVariants,
  StandardPaletteKeys,
  ThemeModes,
  EmissivePanelTypes,
  SystemColorTokens,
  type StandardTone,
  type PaletteVariant,
  type StandardPaletteKey,
  type TonalPaletteOptions,
  type CreatePalettesOptions,
  type PaletteSet,
  type ThemeMode,
  type EmissivePanelType,
  type EmissiveSchemeOptions,
  type BuildDynamicSchemeOptions,
  type ResolveCustomColorsOptions,
  type SystemColorToken,
  type DynamicSchemeColors,
  type CustomColorInput,
  type CustomColorConfig,
  type ResolvedCustomColor,
  type ContrastAuditItem,
} from './application/index.ts'

// 2. Core colorimetric conversion, gamut queries & contrast solvers
export {
  hexToOkyct,
  okyctToHex,
  rgbToOkyct,
  okyctToRgb,
  hexToRgb,
  rgbToHex,
  okyctToDisplayP3Css,
  toneToY,
  yToTone,
  shortestHueDelta,
  findGamutCusp,
  findMaxChromaForTone,
  isInGamut,
  isInSrgbGamut,
  getContrastRatio,
  getApcaContrast,
  solveTonesForContrast,
  solveTonesForApca,
  runColorimetricInvariantSuite,
  GamutTargets,
  GamutMappingModes,
  ContrastMetrics,
  type GamutTarget,
  type GamutMappingMode,
  type ColorConversionOptions,
  type GamutCusp,
  type ContrastMetric,
  type ColorToneInput,
  type OKYCT,
  type RGB,
  type GamutCheckResult,
  type ContrastSolution,
  type InvariantTestResult,
} from './domain/index.ts'

// 3. Emissive display telemetry, image seed extraction & N-layer stacking
export {
  EmissivePanelSpecs,
  computeColorEmissiveTelemetry,
  analyzeEmissiveSchemeMetrics,
  extractSeedsFromImageData,
  type SubpixelGeometry,
  type EmissivePanelSpec,
  type ColorEmissiveTelemetry,
  type SchemeEmissiveReport,
  type ExtractedSeedColor,
  type ImagePixelBuffer,
} from './adapters/index.ts'

export {
  stackLayers,
  stackStateLayers,
  auditStackedContrast,
  stackToCssColorMix,
  type ColorLayer,
  type LayerStepTrace,
  type CompositedResult,
  type StackOptions,
  type StackedContrastReport,
} from './application/index.ts'

// 4. Data-last curried FP combinators
export {
  toTokenDictionary,
  renameCase,
  mapTokens,
  withPrefix,
  pickTokens,
  omitTokens,
  filterTokens,
  nestTokens,
  flattenTokens,
  withAlpha,
  toCssVarRef,
  toCssRuleBlock,
  validateContract,
  diffThemeParity,
  optimizeForOled,
  limitBlueEmission,
  auditOledPower,
  NamingCases,
  type TokenDictionary,
  type TokenSource,
  type NamingCase,
  type ContractValidationReport,
  type OledPowerAuditReport,
} from './adapters/index.ts'

// 5. Hexagonal architecture dependency guard
export * from './architecture-guard.ts'
