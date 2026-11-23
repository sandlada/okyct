/**
 * [Adapters — driven-exporters internal]
 * Formats hex or floating-point OKYCT coordinates into hex, oklch(), or color(display-p3 ...).
 */

import {
  CssColorFormats,
  hexToOkyct,
  okyctToDisplayP3Css,
  okyctToOklchCss,
  type CssColorFormat,
  type OKYCT,
} from '../../../domain/index.ts'
import type { DynamicSchemeColors, SystemColorToken } from '../../../ports/index.ts'

export function resolveExportColorFormat(format: CssColorFormat = 'hex'): CssColorFormat {
  if (!CssColorFormats.includes(format)) {
    throw new Error(
      `Invalid colorFormat: "${String(format)}". Expected one of: ${CssColorFormats.join(', ')}.`
    )
  }
  return format
}

export function formatColorValue(
  hex: string,
  format: CssColorFormat,
  okyct?: OKYCT
): string {
  if (format === 'hex') return hex
  const coord = okyct ?? hexToOkyct(hex)
  if (format === 'oklch') return okyctToOklchCss(coord)
  return okyctToDisplayP3Css(coord)
}

export function formatSchemeToken(
  scheme: DynamicSchemeColors,
  token: SystemColorToken,
  format: CssColorFormat
): string {
  return formatColorValue(scheme[token], format, scheme.okyct?.[token])
}
