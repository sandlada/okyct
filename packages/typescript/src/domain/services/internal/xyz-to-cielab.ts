import type { CIELAB } from './cielab.model.ts'
import type { XYZ } from './xyz.model.ts'

const D65Xn = 0.95047
const D65Yn = 1.0
const D65Zn = 1.08883
const CieEpsilon = 216 / 24389
const CieKappa = 24389 / 27

function labF(t: number): number {
  return t > CieEpsilon ? Math.cbrt(t) : (CieKappa * t + 16) / 116
}

export function xyzToCielab(xyz: XYZ): CIELAB {
  const fx = labF(xyz.x / D65Xn)
  const fy = labF(xyz.y / D65Yn)
  const fz = labF(xyz.z / D65Zn)

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}
