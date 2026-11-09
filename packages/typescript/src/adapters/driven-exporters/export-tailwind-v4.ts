
import { SystemColorTokens, type DynamicSchemeColors, type ResolvedCustomColor } from '../../ports/index.ts'
import { kebabCase } from './internal/kebab-case.ts'

export const TailwindFallbackModes = ['none', 'light-dark'] as const
export type TailwindFallbackMode = (typeof TailwindFallbackModes)[number]

const colorVar = (token: string, light: string, dark: string, fallback: TailwindFallbackMode) => {
  if (fallback === 'light-dark') {
    return `var(${token}, light-dark(${light}, ${dark}))`
  }
  return `var(${token})`
}

export function exportTailwindV4(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  customColorsLight: ResolvedCustomColor[] = [],
  customColorsDark: ResolvedCustomColor[] = [],
  fallback: TailwindFallbackMode = 'light-dark'
): string {
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
