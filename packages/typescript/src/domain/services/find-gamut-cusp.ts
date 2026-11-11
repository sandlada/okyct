
import type { GamutCusp } from '../models/index.ts'
import { findMaxChromaForTone } from './find-max-chroma-for-tone.ts'
import { findCuspForMaxChroma } from './internal/find-cusp-for-max-chroma.ts'

export function findGamutCusp(h: number): GamutCusp {
  return findCuspForMaxChroma(h, findMaxChromaForTone)
}
