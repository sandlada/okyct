
import { hexToOkyct, okyctToHex } from '../domain/index.ts'

export function harmonizeHex(designHex: string, sourceHex: string, maxShiftAngle = 18): string {
  if (!Number.isFinite(maxShiftAngle) || maxShiftAngle < 0) {
    throw new Error(`Invalid maxShiftAngle: ${maxShiftAngle}. Expected a non-negative finite number.`)
  }
  const design = hexToOkyct(designHex)
  const source = hexToOkyct(sourceHex)

  let diff = (source.h - design.h + 180) % 360 - 180
  if (diff < -180) diff += 360

  if (Math.abs(diff) < 120) {
    const shift = Math.sign(diff) * Math.min(Math.abs(diff) * 0.45, maxShiftAngle)
    const newHue = (design.h + shift + 360) % 360
    return okyctToHex({
      h: newHue,
      c: design.c,
      t: design.t,
    })
  }

  return designHex
}
