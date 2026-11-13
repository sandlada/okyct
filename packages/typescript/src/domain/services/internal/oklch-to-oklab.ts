
import type { OKLab } from './oklab.model.ts'
import type { OKLCH } from './oklch.model.ts'

export function oklchToOklab(lch: OKLCH): OKLab {
  const rad = (lch.h * Math.PI) / 180
  return {
    L: lch.L,
    a: lch.C * Math.cos(rad),
    b: lch.C * Math.sin(rad),
  }
}
