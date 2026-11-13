import { findMaxChromaForTone, hexToOkyct, okyctToHex } from '../domain/index.ts'

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function harmonizeHex(designHex: string, sourceHex: string, maxShiftAngle = 18): string {
  if (!Number.isFinite(maxShiftAngle) || maxShiftAngle < 0) {
    throw new Error(`Invalid maxShiftAngle: ${maxShiftAngle}. Expected a non-negative finite number.`)
  }
  const design = hexToOkyct(designHex)
  const source = hexToOkyct(sourceHex)

  // Neutral / near-gray source seeds carry arbitrary hue noise and must not pull semantic colors
  const sourceChromaWeight = smoothstep(0.005, 0.035, source.c)
  if (sourceChromaWeight <= 0) {
    return designHex
  }

  let diff = ((source.h - design.h + 180) % 360) - 180
  if (diff < -180) diff += 360

  if (Math.abs(diff) < 120) {
    const shift = Math.sign(diff) * Math.min(Math.abs(diff) * 0.45, maxShiftAngle) * sourceChromaWeight
    const newHue = (design.h + shift + 360) % 360

    const maxOld = findMaxChromaForTone(design.h, design.t)
    const maxNew = findMaxChromaForTone(newHue, design.t)
    const scaledChroma =
      maxOld > 1e-4 ? Math.min(design.c, design.c * (maxNew / maxOld)) : design.c

    return okyctToHex({
      h: newHue,
      c: scaledChroma,
      t: design.t,
    })
  }

  return designHex
}
