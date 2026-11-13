
import type { OKLab } from './oklab.model.ts'
import type { OKLCH } from './oklch.model.ts'

export function oklabToOklch(lab: OKLab): OKLCH {
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  if (h < 0) h += 360
  const C = Math.hypot(lab.a, lab.b)
  return { L: lab.L, C, h }
}
