
import type { IPaletteGenerationPort } from '../ports/inbound/palette-generation.port.ts'
import { TonalPalette } from './tonal-palette.ts'
import { createPalettesFromSource } from './create-palettes-from-source.ts'
import { harmonizeHex } from './harmonize-hex.ts'
import { isWarmHue } from './is-warm-hue.ts'

export class PaletteGenerationUseCase implements IPaletteGenerationPort<TonalPalette> {
  createPalettesFromSource = createPalettesFromSource
  harmonizeHex = harmonizeHex
  isWarmHue = isWarmHue
}
