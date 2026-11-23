import {
  getContrastRatio,
  hexToRgb,
  linearToSrgb,
  okyctToRgb,
  rgbToHex,
  rgbToOkyct,
  srgbToLinear,
  type RGB,
} from '../domain/index.ts'
import type {
  ColorLayer,
  CompositedResult,
  LayerStepTrace,
  StackOptions,
} from '../ports/index.ts'

interface BlendState {
  rgb: RGB
  alpha: number
}

function blendState(
  fgRgb: RGB,
  fgAlpha: number,
  bg: BlendState,
  blendSpace: 'linear-srgb' | 'gamma-srgb' | 'okyct'
): BlendState {
  const aFg = Math.max(0, Math.min(1, fgAlpha))
  const aBg = Math.max(0, Math.min(1, bg.alpha))
  const aOut = aFg + aBg * (1 - aFg)

  if (aOut <= 0) {
    return { rgb: { r: 0, g: 0, b: 0 }, alpha: 0 }
  }

  const wFg = aFg / aOut
  const wBg = (aBg * (1 - aFg)) / aOut

  if (blendSpace === 'okyct') {
    const fgOkyct = rgbToOkyct(fgRgb)
    const bgOkyct = rgbToOkyct(bg.rgb)

    const fgRad = (fgOkyct.h * Math.PI) / 180
    const bgRad = (bgOkyct.h * Math.PI) / 180

    // Orthogonal OKLab vector interpolation: complements neutralize naturally to gray
    const aMix = fgOkyct.c * Math.cos(fgRad) * wFg + bgOkyct.c * Math.cos(bgRad) * wBg
    const bMix = fgOkyct.c * Math.sin(fgRad) * wFg + bgOkyct.c * Math.sin(bgRad) * wBg

    let hOut = (Math.atan2(bMix, aMix) * 180) / Math.PI
    if (hOut < 0) hOut += 360

    const cOut = Math.hypot(aMix, bMix)
    const tOut = fgOkyct.t * wFg + bgOkyct.t * wBg

    return {
      rgb: okyctToRgb({ h: hOut, c: cOut, t: tOut }),
      alpha: aOut,
    }
  }

  if (blendSpace === 'linear-srgb') {
    const rLin = srgbToLinear(fgRgb.r) * wFg + srgbToLinear(bg.rgb.r) * wBg
    const gLin = srgbToLinear(fgRgb.g) * wFg + srgbToLinear(bg.rgb.g) * wBg
    const bLin = srgbToLinear(fgRgb.b) * wFg + srgbToLinear(bg.rgb.b) * wBg

    return {
      rgb: {
        r: Math.max(0, Math.min(1, linearToSrgb(rLin))),
        g: Math.max(0, Math.min(1, linearToSrgb(gLin))),
        b: Math.max(0, Math.min(1, linearToSrgb(bLin))),
      },
      alpha: aOut,
    }
  }

  return {
    rgb: {
      r: Math.max(0, Math.min(1, fgRgb.r * wFg + bg.rgb.r * wBg)),
      g: Math.max(0, Math.min(1, fgRgb.g * wFg + bg.rgb.g * wBg)),
      b: Math.max(0, Math.min(1, fgRgb.b * wFg + bg.rgb.b * wBg)),
    },
    alpha: aOut,
  }
}

export const stackLayers = (options: StackOptions = {}) =>
  (layers: readonly ColorLayer[]) =>
    (baseColor: string): CompositedResult => {
      const blendSpace = options.blendSpace || 'linear-srgb'
      if (blendSpace !== 'linear-srgb' && blendSpace !== 'gamma-srgb' && blendSpace !== 'okyct') {
        throw new Error(
          `Invalid blendSpace: "${String(blendSpace)}". Expected 'linear-srgb', 'gamma-srgb', or 'okyct'.`
        )
      }
      const traces: LayerStepTrace[] = []

      let state: BlendState = { rgb: hexToRgb(baseColor), alpha: 1.0 }
      let currentHex = rgbToHex(state.rgb)
      let currentOkyct = rgbToOkyct(state.rgb)

      traces.push({
        stepIndex: 0,
        label: 'Base',
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
        state = blendState(hexToRgb(layer.color), layer.opacity, state, blendSpace)
        currentHex = rgbToHex(state.rgb)
        currentOkyct = rgbToOkyct(state.rgb)

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
