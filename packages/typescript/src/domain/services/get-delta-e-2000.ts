import { hexToRgb } from './hex-to-rgb.ts'
import { linearRgbToXyz } from './internal/linear-rgb-to-xyz.ts'
import { xyzToCielab } from './internal/xyz-to-cielab.ts'
import { srgbToLinear } from './srgb-to-linear.ts'

const DegToRad = Math.PI / 180
const RadToDeg = 180 / Math.PI
const TwentyFivePow7 = 6103515625

function hexToCielab(hex: string) {
  const rgb = hexToRgb(hex)
  return xyzToCielab(
    linearRgbToXyz({
      r: srgbToLinear(rgb.r),
      g: srgbToLinear(rgb.g),
      b: srgbToLinear(rgb.b),
    }),
  )
}

function hueAngleDeg(b: number, aPrime: number): number {
  if (aPrime === 0 && b === 0) return 0
  const deg = Math.atan2(b, aPrime) * RadToDeg
  return deg >= 0 ? deg : deg + 360
}

/**
 * Computes CIEDE2000 (ΔE_2000) perceptual color difference with kL = kC = kH = 1.
 */
export function getDeltaE2000(hexA: string, hexB: string): number {
  const lab1 = hexToCielab(hexA)
  const lab2 = hexToCielab(hexB)

  const c1 = Math.hypot(lab1.a, lab1.b)
  const c2 = Math.hypot(lab2.a, lab2.b)
  const cBar = (c1 + c2) * 0.5
  const cBar7 = Math.pow(cBar, 7)
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + TwentyFivePow7)))

  const a1Prime = (1 + g) * lab1.a
  const a2Prime = (1 + g) * lab2.a
  const c1Prime = Math.hypot(a1Prime, lab1.b)
  const c2Prime = Math.hypot(a2Prime, lab2.b)

  const h1Prime = hueAngleDeg(lab1.b, a1Prime)
  const h2Prime = hueAngleDeg(lab2.b, a2Prime)

  const deltaLPrime = lab2.l - lab1.l
  const deltaCPrime = c2Prime - c1Prime

  let deltahPrime = 0
  if (c1Prime * c2Prime !== 0) {
    const diff = h2Prime - h1Prime
    if (Math.abs(diff) <= 180) {
      deltahPrime = diff
    } else if (diff > 180) {
      deltahPrime = diff - 360
    } else {
      deltahPrime = diff + 360
    }
  }

  const deltaHPrime =
    2 * Math.sqrt(c1Prime * c2Prime) * Math.sin((deltahPrime * 0.5) * DegToRad)

  const lBarPrime = (lab1.l + lab2.l) * 0.5
  const cBarPrime = (c1Prime + c2Prime) * 0.5

  let hBarPrime = h1Prime + h2Prime
  if (c1Prime * c2Prime !== 0) {
    if (Math.abs(h1Prime - h2Prime) <= 180) {
      hBarPrime = (h1Prime + h2Prime) * 0.5
    } else if (h1Prime + h2Prime < 360) {
      hBarPrime = (h1Prime + h2Prime + 360) * 0.5
    } else {
      hBarPrime = (h1Prime + h2Prime - 360) * 0.5
    }
  }

  const t =
    1 -
    0.17 * Math.cos((hBarPrime - 30) * DegToRad) +
    0.24 * Math.cos(2 * hBarPrime * DegToRad) +
    0.32 * Math.cos((3 * hBarPrime + 6) * DegToRad) -
    0.20 * Math.cos((4 * hBarPrime - 63) * DegToRad)

  const deltaTheta = 30 * Math.exp(-Math.pow((hBarPrime - 275) / 25, 2))
  const cBarPrime7 = Math.pow(cBarPrime, 7)
  const rC = 2 * Math.sqrt(cBarPrime7 / (cBarPrime7 + TwentyFivePow7))

  const lBarOffsetSq = Math.pow(lBarPrime - 50, 2)
  const sL = 1 + (0.015 * lBarOffsetSq) / Math.sqrt(20 + lBarOffsetSq)
  const sC = 1 + 0.045 * cBarPrime
  const sH = 1 + 0.015 * cBarPrime * t
  const rT = -Math.sin(2 * deltaTheta * DegToRad) * rC

  const termL = deltaLPrime / sL
  const termC = deltaCPrime / sC
  const termH = deltaHPrime / sH

  return Math.sqrt(
    termL * termL + termC * termC + termH * termH + rT * termC * termH,
  )
}
