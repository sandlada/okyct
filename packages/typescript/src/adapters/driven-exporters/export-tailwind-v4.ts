import {
  SystemColorTokens,
  TailwindFallbackModes,
  type TailwindFallbackMode,
  type DynamicSchemeColors,
  type ExportTailwindV4Options,
} from '../../ports/index.ts'
import { formatColorValue, formatSchemeToken, resolveExportColorFormat } from './internal/format-export-color.ts'
import { registerTokenKey } from './internal/assert-no-token-collision.ts'
import { kebabCase } from './internal/kebab-case.ts'
import {
  resolveCustomStateLayersForExport,
  resolveSystemStateLayersForExport,
} from './internal/resolve-export-state-layers.ts'

export { TailwindFallbackModes, type TailwindFallbackMode, type ExportTailwindV4Options }

const colorVar = (token: string, light: string, dark: string, fallback: TailwindFallbackMode) => {
  if (fallback === 'light-dark') {
    return `var(${token}, light-dark(${light}, ${dark}))`
  }
  return `var(${token})`
}

export function exportTailwindV4(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  options: ExportTailwindV4Options = {}
): string {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid exportTailwindV4 options: expected an object.')
  }

  const {
    customColorsLight = [],
    customColorsDark = [],
    fallback = 'light-dark',
    stateLayers,
  } = options

  if (!TailwindFallbackModes.includes(fallback)) {
    throw new Error(`Invalid tailwindFallback: "${String(fallback)}". Expected one of: ${TailwindFallbackModes.join(', ')}.`)
  }
  const colorFormat = resolveExportColorFormat(options.colorFormat)
  const darkByName = new Map(customColorsDark.map((color) => [color.name, color]))
  const tailwindKeys = new Map<string, string>()

  const systemLinesList = SystemColorTokens.map((key) => {
    const k = kebabCase(key)
    const cssVar = `--color-${k}`
    registerTokenKey(tailwindKeys, cssVar, `system role "${key}"`, 'exportTailwindV4')
    const lightVal = formatSchemeToken(lightScheme, key, colorFormat)
    const darkVal = formatSchemeToken(darkScheme, key, colorFormat)
    return `  ${cssVar}: ${colorVar(`--md-sys-color-${k}`, lightVal, darkVal, fallback)};`
  })
  const lightStates = resolveSystemStateLayersForExport(lightScheme, stateLayers)
  const darkStatesMap = new Map(resolveSystemStateLayersForExport(darkScheme, stateLayers))
  for (const [key, lightVal] of lightStates) {
    const darkVal = darkStatesMap.get(key) ?? lightVal
    const k = kebabCase(key)
    const cssVar = `--color-${k}`
    registerTokenKey(tailwindKeys, cssVar, `system state layer "${key}"`, 'exportTailwindV4')
    systemLinesList.push(
      `  ${cssVar}: ${colorVar(
        `--md-sys-color-${k}`,
        formatColorValue(lightVal, colorFormat),
        formatColorValue(darkVal, colorFormat),
        fallback
      )};`
    )
  }
  const systemLines = systemLinesList.join('\n')

  const customLines = customColorsLight
    .flatMap((color) => {
      const dark = darkByName.get(color.name) ?? color
      const k = kebabCase(color.name)
      if (!k) {
        throw new Error(`Invalid custom color name: "${color.name}". Expected at least one alphanumeric word.`)
      }
      const sourceLabel = `custom color "${color.name}"`
      const reg = (cssVar: string) => {
        registerTokenKey(tailwindKeys, cssVar, sourceLabel, 'exportTailwindV4')
        return cssVar
      }
      const lightCustomStates = resolveCustomStateLayersForExport(color, stateLayers)
      const darkCustomStates = resolveCustomStateLayersForExport(dark, stateLayers)
      const darkColorMap = new Map(darkCustomStates.colorStates)
      const darkOnColorMap = new Map(darkCustomStates.onColorStates)
      const darkContainerMap = new Map(darkCustomStates.containerStates)
      const darkOnContainerMap = new Map(darkCustomStates.onContainerStates)

      const fmt = (hex: string) => formatColorValue(hex, colorFormat)

      return [
        `  ${reg(`--color-${k}`)}: ${colorVar(`--md-custom-color-${k}`, fmt(color.color), fmt(dark.color), fallback)};`,
        ...lightCustomStates.colorStates.map(([state, lightHex]) => {
          const darkHex = darkColorMap.get(state) ?? lightHex
          return `  ${reg(`--color-${k}-${state}`)}: ${colorVar(`--md-custom-color-${k}-${state}`, fmt(lightHex), fmt(darkHex), fallback)};`
        }),
        `  ${reg(`--color-on-${k}`)}: ${colorVar(`--md-custom-color-on-${k}`, fmt(color.onColor), fmt(dark.onColor), fallback)};`,
        ...lightCustomStates.onColorStates.map(([state, lightHex]) => {
          const darkHex = darkOnColorMap.get(state) ?? lightHex
          return `  ${reg(`--color-on-${k}-${state}`)}: ${colorVar(`--md-custom-color-on-${k}-${state}`, fmt(lightHex), fmt(darkHex), fallback)};`
        }),
        `  ${reg(`--color-${k}-container`)}: ${colorVar(`--md-custom-color-${k}-container`, fmt(color.colorContainer), fmt(dark.colorContainer), fallback)};`,
        ...lightCustomStates.containerStates.map(([state, lightHex]) => {
          const darkHex = darkContainerMap.get(state) ?? lightHex
          return `  ${reg(`--color-${k}-container-${state}`)}: ${colorVar(`--md-custom-color-${k}-container-${state}`, fmt(lightHex), fmt(darkHex), fallback)};`
        }),
        `  ${reg(`--color-on-${k}-container`)}: ${colorVar(`--md-custom-color-on-${k}-container`, fmt(color.onColorContainer), fmt(dark.onColorContainer), fallback)};`,
        ...lightCustomStates.onContainerStates.map(([state, lightHex]) => {
          const darkHex = darkOnContainerMap.get(state) ?? lightHex
          return `  ${reg(`--color-on-${k}-container-${state}`)}: ${colorVar(`--md-custom-color-on-${k}-container-${state}`, fmt(lightHex), fmt(darkHex), fallback)};`
        }),
      ]
    })
    .join('\n')

  return `/* Tailwind CSS v4 Theme Extension */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
${systemLines}${customLines ? `\n\n  /* Custom Extended Semantic Tokens */\n${customLines}` : ''}
}
`
}
