import {
  GamutTargets,
  findGamutCusp,
  findMaxChromaForTone,
  hexToOkyct,
  okyctToHex,
  type GamutTarget,
} from '../domain/index.ts'
import {
  StandardTones,
  type ITonalPalettePort,
  type StandardTone,
  type TonalPaletteOptions,
} from '../ports/inbound/palette-generation.port.ts'

const SeedNeutralThreshold = 0.025
const WarmYellowCenterHue = 100
const WarmYellowHalfWindow = 28

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function applySoftKnee(chroma: number, maxGamutChroma: number): number {
  if (maxGamutChroma <= 0 || chroma <= 0) return 0
  const knee = 0.8 * maxGamutChroma
  if (chroma <= knee) return chroma
  const headroom = maxGamutChroma - knee
  const excess = chroma - knee
  return knee + headroom * (excess / (excess + headroom))
}

function computeHkToneDelta(hue: number, chroma: number, tone: number): number {
  if (chroma <= 0.02 || tone <= 5 || tone >= 95) return 0
  const rad = (hue * Math.PI) / 180
  // Approximate Helmholtz-Kohlrausch perceptual lightness boost strongest in deep blue/purple & red
  const bluePurpleBoost = 0.5 + 0.5 * Math.cos(rad - (265 * Math.PI) / 180)
  const redBoost = 0.5 + 0.5 * Math.cos(rad - (25 * Math.PI) / 180)
  const hueWeight = 0.45 + 0.55 * Math.max(bluePurpleBoost, redBoost * 0.75)
  const midBell = smoothstep(5, 35, tone) * smoothstep(95, 65, tone)
  return Math.min(6, chroma * 22 * hueWeight * midBell)
}

export class TonalPalette implements ITonalPalettePort {
  readonly hue: number
  readonly targetChroma: number
  readonly gamut: GamutTarget
  readonly hkCompensation: boolean
  readonly softKnee: boolean
  private readonly cache = new Map<number, string>()

  constructor(hue: number, targetChroma: number, options: TonalPaletteOptions = {}) {
    if (!Number.isFinite(hue) || !Number.isFinite(targetChroma) || targetChroma < 0) {
      throw new Error(
        `Invalid TonalPalette arguments: hue=${hue}, targetChroma=${targetChroma}. Expected finite hue and non-negative chroma.`
      )
    }
    const gamut = options.gamut ?? 'srgb'
    if (!GamutTargets.includes(gamut)) {
      throw new Error(`Invalid gamut target: "${String(gamut)}". Expected one of: ${GamutTargets.join(', ')}.`)
    }
    if (options.hkCompensation !== undefined && typeof options.hkCompensation !== 'boolean') {
      throw new Error('Invalid hkCompensation option: expected a boolean.')
    }
    if (options.softKnee !== undefined && typeof options.softKnee !== 'boolean') {
      throw new Error('Invalid softKnee option: expected a boolean.')
    }

    this.hue = ((hue % 360) + 360) % 360
    this.targetChroma = targetChroma
    this.gamut = gamut
    this.hkCompensation = options.hkCompensation ?? false
    this.softKnee = options.softKnee ?? true
  }

  static fromHex(hex: string, options: TonalPaletteOptions = {}): TonalPalette {
    const okyct = hexToOkyct(hex)
    const gamut = options.gamut ?? 'srgb'
    let resolvedChroma = okyct.c

    if (okyct.c > SeedNeutralThreshold && (okyct.t < 22 || okyct.t > 82)) {
      const maxAtSeed = findMaxChromaForTone(okyct.h, okyct.t, { gamut })
      const cusp = findGamutCusp(okyct.h, { gamut })
      if (maxAtSeed > 1e-4 && cusp.chroma > maxAtSeed) {
        const satRatio = Math.min(1, okyct.c / maxAtSeed)
        const extremity = okyct.t < 22 ? smoothstep(22, 6, okyct.t) : smoothstep(82, 96, okyct.t)
        const deattenuated = satRatio * cusp.chroma * 0.72
        resolvedChroma = okyct.c + (Math.max(okyct.c, deattenuated) - okyct.c) * extremity
      }
    }

    return new TonalPalette(okyct.h, resolvedChroma, options)
  }

  tone(toneValue: number): string {
    if (!Number.isFinite(toneValue)) {
      throw new Error(`Invalid tone value: ${toneValue}. Expected a finite number in [0, 100].`)
    }
    const t = Math.max(0, Math.min(100, toneValue))
    const cacheKey = Math.round(t * 1000) / 1000
    const cached = this.cache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    if (t <= 0.001) {
      this.cache.set(cacheKey, '#000000')
      return '#000000'
    }
    if (t >= 99.999) {
      this.cache.set(cacheKey, '#ffffff')
      return '#ffffff'
    }

    const effectiveTone = this.hkCompensation
      ? Math.max(1, t - computeHkToneDelta(this.hue, this.targetChroma, t))
      : t

    const darkRoll = effectiveTone < 18 ? smoothstep(0, 18, effectiveTone) : 1
    const lightRoll = effectiveTone > 85 ? smoothstep(100, 85, effectiveTone) : 1
    let effectiveChroma = this.targetChroma * darkRoll * lightRoll

    if (effectiveTone < 45 && effectiveChroma > 0.02) {
      const dist = Math.abs(((this.hue - WarmYellowCenterHue + 540) % 360) - 180)
      if (dist < WarmYellowHalfWindow) {
        const hueWeight = 0.5 + 0.5 * Math.cos((dist / WarmYellowHalfWindow) * Math.PI)
        const darkFactor = smoothstep(45, 10, effectiveTone)
        effectiveChroma *= 1 - 0.35 * hueWeight * darkFactor
      }
    }

    // Output is an 8-bit sRGB hex stop, so clamp against sRGB boundary smoothly
    const maxGamutChroma = findMaxChromaForTone(this.hue, effectiveTone, { gamut: 'srgb' })
    const finalChroma = this.softKnee
      ? applySoftKnee(effectiveChroma, maxGamutChroma)
      : Math.min(effectiveChroma, maxGamutChroma)

    const colorHex = okyctToHex({
      h: this.hue,
      c: finalChroma,
      t: effectiveTone,
    })

    this.cache.set(cacheKey, colorHex)
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
