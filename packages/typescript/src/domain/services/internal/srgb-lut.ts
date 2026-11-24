/**
 * [Domain Service — module internal]
 * Precomputed 8-bit sRGB byte [0..255] lookup tables and zero-regex base-16 hex parser.
 */

import { trimAsciiWhitespace } from './trim-ascii-whitespace.ts'

function buildSrgbByteToLinearLut(): Float64Array {
  const lut = new Float64Array(256)
  for (let i = 0; i < 256; i++) {
    const c = i / 255
    lut[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return lut
}

function buildSrgbByteToUnitLut(): Float64Array {
  const lut = new Float64Array(256)
  for (let i = 0; i < 256; i++) {
    lut[i] = i / 255
  }
  return lut
}

function buildHexNibbleLut(): Int8Array {
  const lut = new Int8Array(128).fill(-1)
  for (let c = 48; c <= 57; c++) lut[c] = c - 48
  for (let c = 65; c <= 70; c++) lut[c] = c - 55
  for (let c = 97; c <= 102; c++) lut[c] = c - 87
  return lut
}

export const SrgbByteToLinearLut = buildSrgbByteToLinearLut()
export const SrgbByteToUnitLut = buildSrgbByteToUnitLut()
export const HexNibbleLut = buildHexNibbleLut()

export function parseHexToRgb24(hex: string): number {
  if (typeof hex !== 'string') {
    throw new Error(`Invalid hex color input: expected string, received ${typeof hex}`)
  }

  const trimmed = trimAsciiWhitespace(hex)

  const start = trimmed.length > 0 && trimmed.charCodeAt(0) === 35 ? 1 : 0
  const len = trimmed.length - start

  if (len === 6) {
    const c0 = trimmed.charCodeAt(start)
    const c1 = trimmed.charCodeAt(start + 1)
    const c2 = trimmed.charCodeAt(start + 2)
    const c3 = trimmed.charCodeAt(start + 3)
    const c4 = trimmed.charCodeAt(start + 4)
    const c5 = trimmed.charCodeAt(start + 5)
    if ((c0 | c1 | c2 | c3 | c4 | c5) <= 127) {
      const n0 = HexNibbleLut[c0]
      const n1 = HexNibbleLut[c1]
      const n2 = HexNibbleLut[c2]
      const n3 = HexNibbleLut[c3]
      const n4 = HexNibbleLut[c4]
      const n5 = HexNibbleLut[c5]
      if ((n0 | n1 | n2 | n3 | n4 | n5) >= 0) {
        return (n0 << 20) | (n1 << 16) | (n2 << 12) | (n3 << 8) | (n4 << 4) | n5
      }
    }
  } else if (len === 3) {
    const c0 = trimmed.charCodeAt(start)
    const c1 = trimmed.charCodeAt(start + 1)
    const c2 = trimmed.charCodeAt(start + 2)
    if ((c0 | c1 | c2) <= 127) {
      const n0 = HexNibbleLut[c0]
      const n1 = HexNibbleLut[c1]
      const n2 = HexNibbleLut[c2]
      if ((n0 | n1 | n2) >= 0) {
        const r8 = (n0 << 4) | n0
        const g8 = (n1 << 4) | n1
        const b8 = (n2 << 4) | n2
        return (r8 << 16) | (g8 << 8) | b8
      }
    }
  }

  throw new Error(`Invalid hex color format: "${hex}". Expected #RGB or #RRGGBB hexadecimal string.`)
}
