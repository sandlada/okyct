/**
 * [Domain Service — module internal]
 * Precomputed 8-bit sRGB byte [0..255] to linear RGB lookup table.
 */

function buildSrgbByteToLinearLut(): Float64Array {
  const lut = new Float64Array(256)
  for (let i = 0; i < 256; i++) {
    const c = i / 255
    lut[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return lut
}

export const SrgbByteToLinearLut = buildSrgbByteToLinearLut()
