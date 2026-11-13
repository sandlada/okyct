
import { hexToOkyct, okyctToHex, findMaxChromaForTone } from '../domain/index.ts'
import {
  StandardTones,
  type StandardTone,
  type ITonalPalettePort,
} from '../ports/inbound/palette-generation.port.ts'

export class TonalPalette implements ITonalPalettePort {
  readonly hue: number
  readonly targetChroma: number
  private readonly cache = new Map<number, string>()

  constructor(hue: number, targetChroma: number) {
    if (!Number.isFinite(hue) || !Number.isFinite(targetChroma) || targetChroma < 0) {
      throw new Error(`Invalid TonalPalette arguments: hue=${hue}, targetChroma=${targetChroma}. Expected finite hue and non-negative chroma.`)
    }
    this.hue = (hue % 360 + 360) % 360
    this.targetChroma = targetChroma
  }

  static fromHex(hex: string): TonalPalette {
    const okyct = hexToOkyct(hex)
    return new TonalPalette(okyct.h, okyct.c)
  }

  static fromHueAndChroma(hue: number, chroma: number): TonalPalette {
    return new TonalPalette(hue, chroma)
  }

  tone(toneValue: number): string {
    if (!Number.isFinite(toneValue)) {
      throw new Error(`Invalid tone value: ${toneValue}. Expected a finite number in [0, 100].`)
    }
    const t = Math.max(0, Math.min(100, Math.round(toneValue)))
    if (this.cache.has(t)) {
      return this.cache.get(t)!
    }

    let effectiveChroma = this.targetChroma
    if (t > 90) {
      effectiveChroma *= Math.max(0.2, (100 - t) / 10)
    } else if (t < 15) {
      effectiveChroma *= Math.max(0.3, t / 15)
    }

    const maxGamutChroma = findMaxChromaForTone(this.hue, t)
    const finalChroma = Math.min(effectiveChroma, maxGamutChroma)

    const colorHex = okyctToHex({
      h: this.hue,
      c: finalChroma,
      t,
    })

    this.cache.set(t, colorHex)
    return colorHex
  }

  getAllTones(): Record<StandardTone, string> {
    const result: Partial<Record<StandardTone, string>> = {}
    for (const t of StandardTones) {
      result[t] = this.tone(t)
    }
    return result as Record<StandardTone, string>
  }
}
