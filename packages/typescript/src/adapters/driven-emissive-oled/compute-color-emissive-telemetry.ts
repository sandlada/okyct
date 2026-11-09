
import { hexToRgb, srgbToLinear } from '../../domain/index.ts'
import type { ColorEmissiveTelemetry } from '../../ports/outbound/display-physics.port.ts'

const WEIGHT_R = 1.45
const WEIGHT_G = 1.00
const WEIGHT_B = 2.40
const WEIGHT_SUM = WEIGHT_R + WEIGHT_G + WEIGHT_B
const FULL_WHITE_OLED_MW = 820

export function computeColorEmissiveTelemetry(hex: string): ColorEmissiveTelemetry {
  const rgb = hexToRgb(hex)
  const rLin = srgbToLinear(rgb.r)
  const gLin = srgbToLinear(rgb.g)
  const bLin = srgbToLinear(rgb.b)

  const isPixelOff = rLin < 0.0005 && gLin < 0.0005 && bLin < 0.0005

  const gammaDrive = 1.08
  const rDrive = isPixelOff ? 0 : Math.pow(rLin, gammaDrive)
  const gDrive = isPixelOff ? 0 : Math.pow(gLin, gammaDrive)
  const bDrive = isPixelOff ? 0 : Math.pow(bLin, gammaDrive)

  const rMw = (rDrive * WEIGHT_R / WEIGHT_SUM) * FULL_WHITE_OLED_MW
  const gMw = (gDrive * WEIGHT_G / WEIGHT_SUM) * FULL_WHITE_OLED_MW
  const bMw = (bDrive * WEIGHT_B / WEIGHT_SUM) * FULL_WHITE_OLED_MW

  const powerMw = isPixelOff ? 0 : rMw + gMw + bMw
  const aplPercent = ((rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) * 100)

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
  }
}
