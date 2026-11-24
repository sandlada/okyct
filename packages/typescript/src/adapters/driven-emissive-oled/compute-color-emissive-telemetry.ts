import { hexToRgb, srgbToLinear } from '../../domain/index.ts'
import type { ColorEmissiveTelemetry, EmitterState } from '../../ports/index.ts'

const WeightR = 1.05
const WeightG = 0.85
const WeightB = 2.40
const WeightSum = WeightR + WeightG + WeightB
const FullWhiteOledMw = 1000
const NearBlackLinearThreshold = 0.0005

export function computeColorEmissiveTelemetry(hex: string): ColorEmissiveTelemetry {
  const rgb = hexToRgb(hex)
  const rLin = srgbToLinear(rgb.r)
  const gLin = srgbToLinear(rgb.g)
  const bLin = srgbToLinear(rgb.b)

  const isPixelOff = rgb.r === 0 && rgb.g === 0 && rgb.b === 0
  const isNearBlack =
    !isPixelOff &&
    rLin < NearBlackLinearThreshold &&
    gLin < NearBlackLinearThreshold &&
    bLin < NearBlackLinearThreshold
  const emitterState: EmitterState = isPixelOff ? 'off' : isNearBlack ? 'near-black' : 'active'

  const gammaDrive = 1.08
  const rDrive = rLin === 0 ? 0 : Math.pow(rLin, gammaDrive)
  const gDrive = gLin === 0 ? 0 : Math.pow(gLin, gammaDrive)
  const bDrive = bLin === 0 ? 0 : Math.pow(bLin, gammaDrive)

  const rMw = (rDrive * WeightR / WeightSum) * FullWhiteOledMw
  const gMw = (gDrive * WeightG / WeightSum) * FullWhiteOledMw
  const bMw = (bDrive * WeightB / WeightSum) * FullWhiteOledMw

  const powerMw = rMw + gMw + bMw
  // Physical linear CIE Y luminance APL (%)
  const aplPercent = (0.2126729 * rLin + 0.7151522 * gLin + 0.0721750 * bLin) * 100

  const meanOther = (rDrive + gDrive) * 0.5
  const blueAsymmetry = Math.max(0, bDrive - meanOther * 0.6)
  const blueStressIndex = Math.min(
    100,
    Math.round((bDrive * 0.65 + blueAsymmetry * 0.55) * 100)
  )

  return {
    hex,
    rLinear: rLin,
    gLinear: gLin,
    bLinear: bLin,
    powerMw: Math.round(powerMw * 10) / 10,
    channelPowerMw: {
      r: Math.round(rMw * 10) / 10,
      g: Math.round(gMw * 10) / 10,
      b: Math.round(bMw * 10) / 10,
    },
    aplPercent: Math.round(aplPercent * 10) / 10,
    blueStressIndex,
    isPixelOff,
    emitterState,
  }
}
