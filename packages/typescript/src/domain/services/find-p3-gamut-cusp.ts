
import type { GamutCusp } from '../models/index.ts'
import { findMaxP3ChromaForTone } from './find-max-p3-chroma-for-tone.ts'
import { findCuspForMaxChroma } from './internal/find-cusp-for-max-chroma.ts'

export function findP3GamutCusp(h: number): GamutCusp {
  return findCuspForMaxChroma(h, findMaxP3ChromaForTone)
}
