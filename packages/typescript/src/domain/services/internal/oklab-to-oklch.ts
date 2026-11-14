
import type { OKLab } from './oklab.model.ts'
import type { OKLCH } from './oklch.model.ts'

export function oklabToOklch(lab: OKLab): OKLCH {
  const C = Math.hypot(lab.a, lab.b)
  if (C < 1e-7) {
    return { L: lab.L, C: 0, h: 0 }
  }
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  if (h < 0) h += 360
  return { L: lab.L, C, h }
}
