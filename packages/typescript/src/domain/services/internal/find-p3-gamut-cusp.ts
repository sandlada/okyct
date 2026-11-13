
import type { GamutCusp } from './gamut-cusp.model.ts'
import { findMaxP3ChromaForTone } from './find-max-p3-chroma-for-tone.ts'
import { findCuspForMaxChroma } from './find-cusp-for-max-chroma.ts'

export function findP3GamutCusp(h: number): GamutCusp {
  return findCuspForMaxChroma(h, findMaxP3ChromaForTone)
}
