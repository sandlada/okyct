
import {
  SystemColorTokens,
  TailwindFallbackModes,
  type TailwindFallbackMode,
  type DynamicSchemeColors,
  type ResolvedCustomColor,
} from '../../ports/index.ts'
import { kebabCase } from './internal/kebab-case.ts'

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
  fallback: TailwindFallbackMode = 'light-dark'
): string {
  if (!TailwindFallbackModes.includes(fallback)) {
    throw new Error(`Invalid tailwindFallback: "${String(fallback)}". Expected one of: ${TailwindFallbackModes.join(', ')}.`)
  }
  const darkByName = new Map(customColorsDark.map((color) => [color.name, color]))

  const systemLines = SystemColorTokens
    .map((key) => {
      const k = kebabCase(key)
      return `  --color-${k}: ${colorVar(`--md-sys-color-${k}`, lightScheme[key], darkScheme[key], fallback)};`
    })
    .join('\n')

  const customLines = customColorsLight
    .flatMap((color) => {
      const dark = darkByName.get(color.name) ?? color
      const k = kebabCase(color.name)
      if (!k) {
        throw new Error(`Invalid custom color name: "${color.name}". Expected at least one alphanumeric word.`)
      }
      return [
        `  --color-${k}: ${colorVar(`--md-custom-color-${k}`, color.color, dark.color, fallback)};`,
        `  --color-on-${k}: ${colorVar(`--md-custom-color-on-${k}`, color.onColor, dark.onColor, fallback)};`,
        `  --color-${k}-container: ${colorVar(`--md-custom-color-${k}-container`, color.colorContainer, dark.colorContainer, fallback)};`,
        `  --color-on-${k}-container: ${colorVar(`--md-custom-color-on-${k}-container`, color.onColorContainer, dark.onColorContainer, fallback)};`,
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
