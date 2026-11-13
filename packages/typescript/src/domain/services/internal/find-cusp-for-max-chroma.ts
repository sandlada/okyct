/**
 * [Domain Service — module internal]
 * Analytical edge-walking gamut cusp finder in OKLab for sRGB / Display P3.
 */

import type { GamutCusp, GamutTarget, RGB } from '../../models/index.ts'
import { yToTone } from '../y-to-tone.ts'
import { linearP3ToXyz } from './linear-p3-to-xyz.ts'
import { linearRgbToXyz } from './linear-rgb-to-xyz.ts'
import { xyzToOklab } from './xyz-to-oklab.ts'

const ChromaticVertices: ReadonlyArray<RGB> = [
  { r: 1, g: 0, b: 0 },
  { r: 1, g: 1, b: 0 },
  { r: 0, g: 1, b: 0 },
  { r: 0, g: 1, b: 1 },
  { r: 0, g: 0, b: 1 },
  { r: 1, g: 0, b: 1 },
]

function evalEdgePoint(rgb: RGB, gamut: GamutTarget) {
  const xyz = gamut === 'display-p3' ? linearP3ToXyz(rgb) : linearRgbToXyz(rgb)
  const lab = xyzToOklab(xyz)
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  if (h < 0) h += 360
  return {
    hue: h,
    chroma: Math.hypot(lab.a, lab.b),
    tone: yToTone(xyz.y),
  }
}

function buildVertexHues(gamut: GamutTarget): readonly number[] {
  return ChromaticVertices.map((v) => evalEdgePoint(v, gamut).hue)
}

const SrgbVertexHues = buildVertexHues('srgb')
const P3VertexHues = buildVertexHues('display-p3')

function signedHueDiff(actualHue: number, targetHue: number): number {
  return ((actualHue - targetHue + 540) % 360) - 180
}

export function findCuspForMaxChroma(hue: number, gamut: GamutTarget = 'srgb'): GamutCusp {
  const h = ((hue % 360) + 360) % 360
  const vertexHues = gamut === 'display-p3' ? P3VertexHues : SrgbVertexHues

  let edgeIdx = 5
  for (let i = 0; i < 5; i++) {
    if (h >= vertexHues[i] && h < vertexHues[i + 1]) {
      edgeIdx = i
      break
    }
  }

  const v0 = ChromaticVertices[edgeIdx]
  const v1 = ChromaticVertices[(edgeIdx + 1) % 6]

  let lo = 0
  let hi = 1
  let fLo = signedHueDiff(vertexHues[edgeIdx], h)
  let fHi = signedHueDiff(vertexHues[(edgeIdx + 1) % 6], h)
  let side = 0
  let bestT = 50
  let bestC = 0

  for (let i = 0; i < 16; i++) {
    const denom = fHi - fLo
    let u = Math.abs(denom) > 1e-12 ? (lo * fHi - hi * fLo) / denom : (lo + hi) * 0.5
    if (!(u > lo && u < hi)) u = (lo + hi) * 0.5

    const sample = evalEdgePoint(
      {
        r: v0.r + (v1.r - v0.r) * u,
        g: v0.g + (v1.g - v0.g) * u,
        b: v0.b + (v1.b - v0.b) * u,
      },
      gamut
    )
    bestT = sample.tone
    bestC = sample.chroma

    const err = signedHueDiff(sample.hue, h)
    if (Math.abs(err) < 1e-4 || hi - lo < 1e-6) break

    if (err <= 0) {
      lo = u
      fLo = err
      if (side === -1) fHi *= 0.5
      side = -1
    } else {
      hi = u
      fHi = err
      if (side === 1) fLo *= 0.5
      side = 1
    }
  }

  return { tone: bestT, chroma: bestC }
}
