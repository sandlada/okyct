/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ITokenExporterPort } from '../../ports/outbound/token-exporter.port.ts'
import type { TonalPalette } from '../../application/tonal-palette.ts'
import { exportCssVariables } from './export-css-variables.ts'
import { exportTailwindV4 } from './export-tailwind-v4.ts'
import { exportW3cDesignTokens } from './export-w3c-design-tokens.ts'
import { exportTypeScriptTokens } from './export-typescript-tokens.ts'

export class MultiFormatTokenExporterAdapter implements ITokenExporterPort<TonalPalette> {
  exportCssVariables = exportCssVariables
  exportTailwindV4 = exportTailwindV4
  exportW3cDesignTokens = exportW3cDesignTokens
  exportTypeScriptTokens = exportTypeScriptTokens
}
