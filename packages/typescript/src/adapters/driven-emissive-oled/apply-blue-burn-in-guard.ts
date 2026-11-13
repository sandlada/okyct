import { hexToOkyct, okyctToHex, shortestHueDelta } from '../../domain/index.ts'

const BlueHazardCenterHue = 265
const BlueHazardHalfWindowDeg = 42

export function applyBlueBurnInGuard(
  hex: string,
  options: { maxBlueAttenuation?: number; hueShiftDeg?: number } = {}
): string {
  const maxAtten = options.maxBlueAttenuation ?? 0.22
  const maxShift = options.hueShiftDeg ?? 3.0
  if (!Number.isFinite(maxAtten) || maxAtten < 0 || maxAtten > 1) {
    throw new Error(`Invalid maxBlueAttenuation: ${maxAtten}. Expected a finite number in [0, 1].`)
  }
  if (!Number.isFinite(maxShift) || maxShift < 0) {
    throw new Error(`Invalid hueShiftDeg: ${maxShift}. Expected a non-negative finite number.`)
  }

  const okyct = hexToOkyct(hex)
  if (okyct.c < 0.025) return hex

  const angularDist = shortestHueDelta(okyct.h, BlueHazardCenterHue)
  if (angularDist >= BlueHazardHalfWindowDeg) return hex

  // C1-continuous raised-cosine window across [223°, 307°]; shifts smoothly toward cyan/green
  // to offload inefficient blue OLED drive onto higher-efficacy green subpixels with zero 265° jump.
  const weight = 0.5 * (1 + Math.cos((angularDist / BlueHazardHalfWindowDeg) * Math.PI))
  const newChroma = okyct.c * (1 - maxAtten * weight)
  const newHue = (okyct.h - maxShift * weight + 360) % 360

  return okyctToHex({
    h: newHue,
    c: newChroma,
    t: okyct.t,
  })
}
