
import {
  hexToRgb,
  rgbToHex,
  srgbToLinear,
  linearToSrgb,
  rgbToOkyct,
  okyctToRgb,
  getContrastRatio,
  type RGB,
} from '../domain/index.ts'
import type { ColorLayer, LayerStepTrace, CompositedResult, StackOptions } from '../ports/inbound/layer-stacking.port.ts'

function blendTwoColors(
  fgColor: string,
  fgAlpha: number,
  bgColor: string,
  bgAlpha = 1.0,
  blendSpace: 'linear-srgb' | 'gamma-srgb' | 'okyct' = 'linear-srgb'
): { hex: string; alpha: number } {
  const fgRgb = hexToRgb(fgColor)
  const bgRgb = hexToRgb(bgColor)

  const a_fg = Math.max(0, Math.min(1, fgAlpha))
  const a_bg = Math.max(0, Math.min(1, bgAlpha))

  const a_out = a_fg + a_bg * (1 - a_fg)
  if (a_out <= 0) return { hex: '#000000', alpha: 0 }

  const wFg = a_fg / a_out
  const wBg = (a_bg * (1 - a_fg)) / a_out

  if (blendSpace === 'okyct') {
    const fgOkyct = rgbToOkyct(fgRgb)
    const bgOkyct = rgbToOkyct(bgRgb)

    const fgRad = (fgOkyct.h * Math.PI) / 180
    const bgRad = (bgOkyct.h * Math.PI) / 180

    const aMix = fgOkyct.c * Math.cos(fgRad) * wFg + bgOkyct.c * Math.cos(bgRad) * wBg
    const bMix = fgOkyct.c * Math.sin(fgRad) * wFg + bgOkyct.c * Math.sin(bgRad) * wBg

    let hOut = (Math.atan2(bMix, aMix) * 180) / Math.PI
    if (hOut < 0) hOut += 360

    const vectorChroma = Math.hypot(aMix, bMix)
    const scalarChroma = fgOkyct.c * wFg + bgOkyct.c * wBg
    const cOut = vectorChroma * 0.7 + scalarChroma * 0.3

    const tOut = fgOkyct.t * wFg + bgOkyct.t * wBg

    const outRgb = okyctToRgb({ h: hOut, c: cOut, t: tOut })
    return { hex: rgbToHex(outRgb), alpha: a_out }
  }

  let r_out = 0
  let g_out = 0
  let b_out = 0

  if (blendSpace === 'linear-srgb') {
    const fgLin = { r: srgbToLinear(fgRgb.r), g: srgbToLinear(fgRgb.g), b: srgbToLinear(fgRgb.b) }
    const bgLin = { r: srgbToLinear(bgRgb.r), g: srgbToLinear(bgRgb.g), b: srgbToLinear(bgRgb.b) }

    const r_lin = fgLin.r * wFg + bgLin.r * wBg
    const g_lin = fgLin.g * wFg + bgLin.g * wBg
    const b_lin = fgLin.b * wFg + bgLin.b * wBg

    r_out = linearToSrgb(r_lin)
    g_out = linearToSrgb(g_lin)
    b_out = linearToSrgb(b_lin)
  } else {
    r_out = fgRgb.r * wFg + bgRgb.r * wBg
    g_out = fgRgb.g * wFg + bgRgb.g * wBg
    b_out = fgRgb.b * wFg + bgRgb.b * wBg
  }

  const outRgb: RGB = {
    r: Math.max(0, Math.min(1, r_out)),
    g: Math.max(0, Math.min(1, g_out)),
    b: Math.max(0, Math.min(1, b_out)),
  }

  return { hex: rgbToHex(outRgb), alpha: a_out }
}

export const stackLayers = (options: StackOptions = {}) =>
  (layers: readonly ColorLayer[]) =>
    (baseColor: string): CompositedResult => {
      const blendSpace = options.blendSpace || 'linear-srgb'
      if (blendSpace !== 'linear-srgb' && blendSpace !== 'gamma-srgb' && blendSpace !== 'okyct') {
        throw new Error(`Invalid blendSpace: "${String(blendSpace)}". Expected 'linear-srgb', 'gamma-srgb', or 'okyct'.`)
      }
      const traces: LayerStepTrace[] = []

      let currentHex = baseColor
      let currentOkyct = rgbToOkyct(hexToRgb(currentHex))

      traces.push({
        stepIndex: 0,
        label: 'Base 底层',
        layerColor: baseColor,
        layerOpacity: 1.0,
        accumulatedHex: currentHex,
        accumulatedOkyct: currentOkyct,
        wcagContrastWithWhite: getContrastRatio(currentOkyct.t, 100),
        wcagContrastWithBlack: getContrastRatio(currentOkyct.t, 0),
      })

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        if (!Number.isFinite(layer.opacity)) {
          throw new Error(`Invalid layer opacity at index ${i}: ${layer.opacity}. Expected a finite number.`)
        }
        const blended = blendTwoColors(layer.color, layer.opacity, currentHex, 1.0, blendSpace)
        currentHex = blended.hex
        currentOkyct = rgbToOkyct(hexToRgb(currentHex))

        traces.push({
          stepIndex: i + 1,
          label: layer.label || `Layer ${i + 1}`,
          layerColor: layer.color,
          layerOpacity: layer.opacity,
          accumulatedHex: currentHex,
          accumulatedOkyct: currentOkyct,
          wcagContrastWithWhite: getContrastRatio(currentOkyct.t, 100),
          wcagContrastWithBlack: getContrastRatio(currentOkyct.t, 0),
        })
      }

      return {
        baseColor,
        totalLayers: layers.length,
        finalHex: currentHex,
        finalOkyct: currentOkyct,
        traces,
        blendSpace,
      }
    }
