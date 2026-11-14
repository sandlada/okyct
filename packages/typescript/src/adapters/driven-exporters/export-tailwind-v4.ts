
import {
  SystemColorTokens,
  TailwindFallbackModes,
  type TailwindFallbackMode,
  type DynamicSchemeColors,
  type ResolvedCustomColor,
  type StateLayersOption,
} from '../../ports/index.ts'
import { kebabCase } from './internal/kebab-case.ts'
import {
  resolveCustomStateLayersForExport,
  resolveSystemStateLayersForExport,
} from './internal/resolve-export-state-layers.ts'

export { TailwindFallbackModes, type TailwindFallbackMode }

const colorVar = (token: string, light: string, dark: string, fallback: TailwindFallbackMode) => {
  if (fallback === 'light-dark') {
    return `var(${token}, light-dark(${light}, ${dark}))`
  }
  return `var(${token})`
}

export function exportTailwindV4(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  customColorsLight: readonly ResolvedCustomColor[] = [],
  customColorsDark: readonly ResolvedCustomColor[] = [],
  fallback: TailwindFallbackMode = 'light-dark',
  stateLayers?: StateLayersOption
): string {
  if (!TailwindFallbackModes.includes(fallback)) {
    throw new Error(`Invalid tailwindFallback: "${String(fallback)}". Expected one of: ${TailwindFallbackModes.join(', ')}.`)
  }
  const darkByName = new Map(customColorsDark.map((color) => [color.name, color]))

  const systemLinesList = SystemColorTokens.map((key) => {
    const k = kebabCase(key)
    return `  --color-${k}: ${colorVar(`--md-sys-color-${k}`, lightScheme[key], darkScheme[key], fallback)};`
  })
  const lightStates = resolveSystemStateLayersForExport(lightScheme, stateLayers)
  const darkStatesMap = new Map(resolveSystemStateLayersForExport(darkScheme, stateLayers))
  for (const [key, lightVal] of lightStates) {
    const darkVal = darkStatesMap.get(key) ?? lightVal
    const k = kebabCase(key)
    systemLinesList.push(
      `  --color-${k}: ${colorVar(`--md-sys-color-${k}`, lightVal, darkVal, fallback)};`
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
      const lightCustomStates = resolveCustomStateLayersForExport(color, stateLayers)
      const darkCustomStates = resolveCustomStateLayersForExport(dark, stateLayers)
      const darkColorMap = new Map(darkCustomStates.colorStates)
      const darkOnColorMap = new Map(darkCustomStates.onColorStates)
      const darkContainerMap = new Map(darkCustomStates.containerStates)
      const darkOnContainerMap = new Map(darkCustomStates.onContainerStates)

      return [
        `  --color-${k}: ${colorVar(`--md-custom-color-${k}`, color.color, dark.color, fallback)};`,
        ...lightCustomStates.colorStates.map(([state, lightHex]) => {
          const darkHex = darkColorMap.get(state) ?? lightHex
          return `  --color-${k}-${state}: ${colorVar(`--md-custom-color-${k}-${state}`, lightHex, darkHex, fallback)};`
        }),
        `  --color-on-${k}: ${colorVar(`--md-custom-color-on-${k}`, color.onColor, dark.onColor, fallback)};`,
        ...lightCustomStates.onColorStates.map(([state, lightHex]) => {
          const darkHex = darkOnColorMap.get(state) ?? lightHex
          return `  --color-on-${k}-${state}: ${colorVar(`--md-custom-color-on-${k}-${state}`, lightHex, darkHex, fallback)};`
        }),
        `  --color-${k}-container: ${colorVar(`--md-custom-color-${k}-container`, color.colorContainer, dark.colorContainer, fallback)};`,
        ...lightCustomStates.containerStates.map(([state, lightHex]) => {
          const darkHex = darkContainerMap.get(state) ?? lightHex
          return `  --color-${k}-container-${state}: ${colorVar(`--md-custom-color-${k}-container-${state}`, lightHex, darkHex, fallback)};`
        }),
        `  --color-on-${k}-container: ${colorVar(`--md-custom-color-on-${k}-container`, color.onColorContainer, dark.onColorContainer, fallback)};`,
        ...lightCustomStates.onContainerStates.map(([state, lightHex]) => {
          const darkHex = darkOnContainerMap.get(state) ?? lightHex
          return `  --color-on-${k}-container-${state}: ${colorVar(`--md-custom-color-on-${k}-container-${state}`, lightHex, darkHex, fallback)};`
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
