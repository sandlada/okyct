
import { hexToOkyct, okyctToHex } from '../../domain/index.ts'

export function applyBlueBurnInGuard(
  hex: string,
  options: { maxBlueAttenuation?: number; hueShiftDeg?: number } = {}
): string {
  const maxAtten = options.maxBlueAttenuation ?? 0.22
  const maxShift = options.hueShiftDeg ?? 6.0

  const okyct = hexToOkyct(hex)
  if (okyct.c < 0.025) return hex

  let angularDist = Math.abs(okyct.h - 265) % 360
  if (angularDist > 180) angularDist = 360 - angularDist

  if (angularDist > 50) return hex

  const weight = Math.cos((angularDist / 50) * (Math.PI / 2))
  const newChroma = okyct.c * (1 - maxAtten * weight)
  const shiftSign = okyct.h >= 195 && okyct.h <= 330 ? -1 : 1
  const newHue = (okyct.h + shiftSign * maxShift * weight + 360) % 360

  return okyctToHex({
    h: newHue,
    c: newChroma,
    t: okyct.t,
  })
}
