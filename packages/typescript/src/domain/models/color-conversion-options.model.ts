import type { GamutTarget } from './gamut-target.model.ts'
import type { GamutMappingMode } from './gamut-mapping-mode.model.ts'

export interface ColorConversionOptions {
  gamut?: GamutTarget
  gamutMapping?: GamutMappingMode
}
