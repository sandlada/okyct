import { GamutTargets, type GamutCusp, type GamutTarget } from '../models/index.ts'
import { findCuspForMaxChroma } from './internal/find-cusp-for-max-chroma.ts'

export function findGamutCusp(
  hue: number,
  options: { gamut?: GamutTarget } = {}
): GamutCusp {
  if (!Number.isFinite(hue)) {
    throw new Error(`Invalid hue: ${hue}. Expected a finite number.`)
  }
  const gamut = options.gamut ?? 'srgb'
  if (!GamutTargets.includes(gamut)) {
    throw new Error(`Invalid gamut target: "${String(gamut)}". Expected one of: ${GamutTargets.join(', ')}.`)
  }
  return findCuspForMaxChroma(hue, gamut)
}
