
import { hexToOkyct, okyctToHex, shortestHueDelta } from '../../domain/index.ts'

const BlueHazardCenterHue = 265
const BlueHazardHalfWindowDeg = 40

export function applyBlueBurnInGuard(
  hex: string,
  options: { maxBlueAttenuation?: number; hueShiftDeg?: number } = {}
): string {
  const maxAtten = options.maxBlueAttenuation ?? 0.22
  const maxShift = options.hueShiftDeg ?? 6.0
  if (!Number.isFinite(maxAtten) || maxAtten < 0 || maxAtten > 1) {
    throw new Error(`Invalid maxBlueAttenuation: ${maxAtten}. Expected a finite number in [0, 1].`)
  }
  if (!Number.isFinite(maxShift)) {
    throw new Error(`Invalid hueShiftDeg: ${maxShift}. Expected a finite number.`)
  }

  const okyct = hexToOkyct(hex)
  if (okyct.c < 0.025) return hex

  const angularDist = shortestHueDelta(okyct.h, BlueHazardCenterHue)
  if (angularDist > BlueHazardHalfWindowDeg) return hex

  const weight = Math.cos((angularDist / BlueHazardHalfWindowDeg) * (Math.PI / 2))
  const newChroma = okyct.c * (1 - maxAtten * weight)
  const shiftSign = okyct.h <= BlueHazardCenterHue ? -1 : 1
  const newHue = (okyct.h + shiftSign * maxShift * weight + 360) % 360

  return okyctToHex({
    h: newHue,
    c: newChroma,
    t: okyct.t,
  })
}
