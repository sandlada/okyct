/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemColorTokens, type DynamicSchemeColors, type ResolvedCustomColor } from '../../ports/index.ts'
import { kebabCase } from './internal/kebab-case.ts'

export function exportTailwindV4(
  lightScheme: DynamicSchemeColors,
  darkScheme: DynamicSchemeColors,
  customColorsLight: ResolvedCustomColor[] = []
): string {
  void lightScheme
  void darkScheme

  const systemLines = SystemColorTokens
    .map((key) => {
      const k = kebabCase(key)
      return `  --color-${k}: var(--md-sys-color-${k});`
    })
    .join('\n')

  const customLines = customColorsLight
    .flatMap((c) => {
      const k = kebabCase(c.name)
      return [
        `  --color-${k}: var(--md-custom-color-${k});`,
        `  --color-on-${k}: var(--md-custom-color-on-${k});`,
        `  --color-${k}-container: var(--md-custom-color-${k}-container);`,
        `  --color-on-${k}-container: var(--md-custom-color-on-${k}-container);`,
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
