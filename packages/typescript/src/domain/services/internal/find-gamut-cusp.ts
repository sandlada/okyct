
import type { GamutCusp } from './gamut-cusp.model.ts'
import { findMaxChromaForTone } from '../find-max-chroma-for-tone.ts'
import { findCuspForMaxChroma } from './find-cusp-for-max-chroma.ts'

export function findGamutCusp(h: number): GamutCusp {
  return findCuspForMaxChroma(h, findMaxChromaForTone)
}
