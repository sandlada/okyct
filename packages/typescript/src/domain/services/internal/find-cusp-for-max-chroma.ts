/**
 * [Domain Service — module internal]
 * Analytical edge-walking gamut cusp finder in OKLab for sRGB / Display P3.
 */

import type { GamutCusp, GamutTarget, RGB } from '../../models/index.ts'
import { yToTone } from '../y-to-tone.ts'
import { linearP3ToXyz } from './linear-p3-to-xyz.ts'
import { linearRgbToXyz } from './linear-rgb-to-xyz.ts'
import { xyzToOklab } from './xyz-to-oklab.ts'

interface VertexCusp {
  hue: number
  chroma: number
  tone: number
}

const DegToRad = Math.PI / 180
const RadToDeg = 180 / Math.PI

const ChromaticVertices: ReadonlyArray<RGB> = [
  { r: 1, g: 0, b: 0 },
  { r: 1, g: 1, b: 0 },
  { r: 0, g: 1, b: 0 },
  { r: 0, g: 1, b: 1 },
  { r: 0, g: 0, b: 1 },
  { r: 1, g: 0, b: 1 },
]

function evalVertex(rgb: RGB, gamut: GamutTarget): VertexCusp {
  const xyz = gamut === 'display-p3' ? linearP3ToXyz(rgb) : linearRgbToXyz(rgb)
  const lab = xyzToOklab(xyz)
  let h = Math.atan2(lab.b, lab.a) * RadToDeg
  if (h < 0) h += 360
  return {
    hue: h,
    chroma: Math.hypot(lab.a, lab.b),
    tone: yToTone(xyz.y),
  }
}

function buildVertexTable(gamut: GamutTarget): readonly VertexCusp[] {
  return ChromaticVertices.map((v) => evalVertex(v, gamut))
}

const SrgbVertices = buildVertexTable('srgb')
const P3Vertices = buildVertexTable('display-p3')

function signedHueDiff(actualHue: number, targetHue: number): number {
  return ((actualHue - targetHue + 540) % 360) - 180
}

export function findContainingEdgeIndex(h: number, vertices: readonly VertexCusp[]): number {
  const n = vertices.length
  for (let i = 0; i < n; i++) {
    const h0 = vertices[i].hue
    const h1 = vertices[(i + 1) % n].hue
    const span = (h1 - h0 + 360) % 360
    const offset = (h - h0 + 360) % 360
    if (offset < span) {
      return i
    }
  }
  return n - 1
}

export function findCuspForMaxChroma(hue: number, gamut: GamutTarget = 'srgb'): GamutCusp {
  let h = hue % 360
  if (h < 0) h += 360
  const isP3 = gamut === 'display-p3'
  const vertices = isP3 ? P3Vertices : SrgbVertices

  const edgeIdx = findContainingEdgeIndex(h, vertices)

  const v0Vert = vertices[edgeIdx]
  let fLo = signedHueDiff(v0Vert.hue, h)
  if (Math.abs(fLo) < 1e-7) {
    return { tone: v0Vert.tone, chroma: v0Vert.chroma }
  }
  const v1Vert = vertices[(edgeIdx + 1) % 6]
  let fHi = signedHueDiff(v1Vert.hue, h)
  if (Math.abs(fHi) < 1e-7) {
    return { tone: v1Vert.tone, chroma: v1Vert.chroma }
  }

  const v0 = ChromaticVertices[edgeIdx]
  const v1 = ChromaticVertices[(edgeIdx + 1) % 6]
  const dr = v1.r - v0.r
  const dg = v1.g - v0.g
  const db = v1.b - v0.b

  const targetRad = h * DegToRad
  const refCos = Math.cos(targetRad)
  const refSin = Math.sin(targetRad)

  let lo = 0
  let hi = 1
  let side = 0
  let bestY = 0
  let bestA = 0
  let bestB = 0

  for (let i = 0; i < 16; i++) {
    const denom = fHi - fLo
    let u = Math.abs(denom) > 1e-12 ? (lo * fHi - hi * fLo) / denom : (lo + hi) * 0.5
    if (!(u > lo && u < hi)) u = (lo + hi) * 0.5

    const r = v0.r + dr * u
    const g = v0.g + dg * u
    const b = v0.b + db * u

    let x: number
    let y: number
    let z: number
    if (isP3) {
      x = 0.4865710 * r + 0.2656677 * g + 0.1982173 * b
      y = 0.2289746 * r + 0.6917385 * g + 0.0792869 * b
      z = 0.0451134 * g + 1.0439444 * b
    } else {
      x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
      y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
      z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b
    }

    const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
    const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
    const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)

    bestA = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    bestB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    bestY = y

    const dParallel = bestA * refCos + bestB * refSin
    const dPerp = bestB * refCos - bestA * refSin
    const err = Math.atan2(dPerp, dParallel) * RadToDeg
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

  return {
    tone: yToTone(bestY),
    chroma: Math.hypot(bestA, bestB),
  }
}
