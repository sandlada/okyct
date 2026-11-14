/**
 * [Hexagonal Layer: Domain Service]
 * Physically accurate linear-light Color Vision Deficiency (CVD) simulation
 * using Machado 2009 / Viénot 1999 linear sRGB projection matrices.
 */

import { CvdTypes, type CvdType } from '../models/cvd-type.model.ts'
import { hexToRgb } from './hex-to-rgb.ts'
import { linearToSrgb } from './linear-to-srgb.ts'
import { rgbToHex } from './rgb-to-hex.ts'
import { srgbToLinear } from './srgb-to-linear.ts'

type Matrix3x3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
]

const CvdLinearMatrices: Record<Exclude<CvdType, 'none'>, Matrix3x3> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
  achromatopsia: [
    [0.2126729, 0.7151522, 0.072175],
    [0.2126729, 0.7151522, 0.072175],
    [0.2126729, 0.7151522, 0.072175],
  ],
}

export function simulateCvd(hex: string, type: CvdType, severity = 1.0): string {
  if (!CvdTypes.includes(type)) {
    throw new Error(`Invalid CVD type: "${String(type)}". Expected one of: ${CvdTypes.join(', ')}.`)
  }
  if (!Number.isFinite(severity)) {
    throw new Error(`Invalid CVD severity: ${severity}. Expected a finite number in [0, 1].`)
  }

  const rgb = hexToRgb(hex)
  const s = Math.max(0, Math.min(1, severity))
  if (type === 'none' || s === 0) return hex

  const rl = srgbToLinear(rgb.r)
  const gl = srgbToLinear(rgb.g)
  const bl = srgbToLinear(rgb.b)

  const m = CvdLinearMatrices[type]
  const rProj = m[0][0] * rl + m[0][1] * gl + m[0][2] * bl
  const gProj = m[1][0] * rl + m[1][1] * gl + m[1][2] * bl
  const bProj = m[2][0] * rl + m[2][1] * gl + m[2][2] * bl

  const rOut = Math.max(0, Math.min(1, (1 - s) * rl + s * rProj))
  const gOut = Math.max(0, Math.min(1, (1 - s) * gl + s * gProj))
  const bOut = Math.max(0, Math.min(1, (1 - s) * bl + s * bProj))

  return rgbToHex({
    r: linearToSrgb(rOut),
    g: linearToSrgb(gOut),
    b: linearToSrgb(bOut),
  })
}
