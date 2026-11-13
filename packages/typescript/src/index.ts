/**
 * OKYCT Color Engine — Unified Ergonomic Public Entry
 *
 * 架构分层 (Hexagonal / Ports & Adapters):
 * - Layer 1: ./domain       (纯色度学数学与对比度核心)
 * - Layer 2: ./ports        (驱动端与被驱动端契约边界)
 * - Layer 3: ./application  (调色板、MD3 令牌与叠层编排用例)
 * - Layer 4: ./adapters     (一站式主题构建、OLED 物理面板、多格式导出、图像量化、FP 组合子)
 */

// 1. 一站式主题构建、动态配色方案与调色板 API
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
  type PaletteSet,
  type ThemeMode,
  type EmissivePanelType,
  type EmissiveSchemeOptions,
  type SystemColorToken,
  type DynamicSchemeColors,
  type CustomColorInput,
  type CustomColorConfig,
  type ResolvedCustomColor,
  type ContrastAuditItem,
} from './application/index.ts'

// 2. 核心色度学转换、色域检测与无障碍对比度求解
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
  findMaxChromaForTone,
  isInSrgbGamut,
  getContrastRatio,
  getApcaContrast,
  solveTonesForContrast,
  runColorimetricInvariantSuite,
  type ColorToneInput,
  type OKYCT,
  type RGB,
  type GamutCheckResult,
  type ContrastSolution,
  type InvariantTestResult,
} from './domain/index.ts'

// 3. 自发光显示物理遥测、图像种子提取与 N 层状态叠加
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

// 4. 函数式编程柯里化组合子 (Data-Last Curried Combinators)
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

// 5. 六边形架构拓扑自检守卫
export * from './architecture-guard.ts'
