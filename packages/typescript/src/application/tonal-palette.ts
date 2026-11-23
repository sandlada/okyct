import {
  CssColorFormats,
  GamutTargets,
  findGamutCusp,
  findMaxChromaForTone,
  hexToOkyct,
  okyctToDisplayP3Css,
  okyctToHex,
  okyctToOklchCss,
  type CssColorFormat,
  type GamutTarget,
  type OKYCT,
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
const DefaultMaxToneCacheSize = 256

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

function getLru<K, V>(map: Map<K, V>, key: K): V | undefined {
  const value = map.get(key)
  if (value === undefined) return undefined
  map.delete(key)
  map.set(key, value)
  return value
}

function setLru<K, V>(map: Map<K, V>, key: K, value: V, maxSize: number): void {
  if (maxSize <= 0) return
  if (map.has(key)) {
    map.delete(key)
  } else if (map.size >= maxSize) {
    const oldestKey = map.keys().next().value
    if (oldestKey !== undefined) {
      map.delete(oldestKey)
    }
  }
  map.set(key, value)
}

export class TonalPalette implements ITonalPalettePort {
  readonly hue: number
  readonly targetChroma: number
  readonly gamut: GamutTarget
  readonly hkCompensation: boolean
  readonly softKnee: boolean
  readonly maxCacheSize: number
  private readonly hexCache = new Map<number, string>()
  private readonly okyctCache = new Map<string, OKYCT>()

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
    const maxCacheSize = options.maxCacheSize ?? DefaultMaxToneCacheSize
    if (!Number.isInteger(maxCacheSize) || maxCacheSize < 0) {
      throw new Error(
        `Invalid maxCacheSize: ${maxCacheSize}. Expected a non-negative integer.`
      )
    }

    this.hue = ((hue % 360) + 360) % 360
    this.targetChroma = targetChroma
    this.gamut = gamut
    this.hkCompensation = options.hkCompensation ?? false
    this.softKnee = options.softKnee ?? true
    this.maxCacheSize = maxCacheSize
  }

  get cacheSize(): number {
    return this.hexCache.size + this.okyctCache.size
  }

  static fromHex(hex: string, options: TonalPaletteOptions = {}): TonalPalette {
    const okyct = hexToOkyct(hex)
    const gamut = options.gamut ?? 'srgb'
    if (!GamutTargets.includes(gamut)) {
      throw new Error(`Invalid gamut target: "${String(gamut)}". Expected one of: ${GamutTargets.join(', ')}.`)
    }
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

  toneOkyct(toneValue: number, options: { gamut?: GamutTarget } = {}): OKYCT {
    if (!Number.isFinite(toneValue)) {
      throw new Error(`Invalid tone value: ${toneValue}. Expected a finite number in [0, 100].`)
    }
    const gamut = options.gamut ?? this.gamut
    if (!GamutTargets.includes(gamut)) {
      throw new Error(`Invalid gamut target: "${String(gamut)}". Expected one of: ${GamutTargets.join(', ')}.`)
    }

    const t = Math.max(0, Math.min(100, toneValue))
    const roundedT = Math.round(t * 1000) / 1000
    const cacheKey = `${gamut}:${roundedT}`
    const cached = getLru(this.okyctCache, cacheKey)
    if (cached !== undefined) {
      return { ...cached }
    }

    let result: OKYCT
    if (t <= 0.001) {
      result = { h: this.hue, c: 0, t: 0 }
    } else if (t >= 99.999) {
      result = { h: this.hue, c: 0, t: 100 }
    } else {
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

      const maxGamutChroma = findMaxChromaForTone(this.hue, effectiveTone, { gamut })
      const finalChroma = this.softKnee
        ? applySoftKnee(effectiveChroma, maxGamutChroma)
        : Math.min(effectiveChroma, maxGamutChroma)

      result = {
        h: this.hue,
        c: finalChroma,
        t: effectiveTone,
      }
    }

    setLru(this.okyctCache, cacheKey, result, this.maxCacheSize)
    return { ...result }
  }

  tone(toneValue: number): string {
    if (!Number.isFinite(toneValue)) {
      throw new Error(`Invalid tone value: ${toneValue}. Expected a finite number in [0, 100].`)
    }
    const t = Math.max(0, Math.min(100, toneValue))
    const cacheKey = Math.round(t * 1000) / 1000
    const cached = getLru(this.hexCache, cacheKey)
    if (cached !== undefined) {
      return cached
    }

    let colorHex: string
    if (t <= 0.001) {
      colorHex = '#000000'
    } else if (t >= 99.999) {
      colorHex = '#ffffff'
    } else {
      const okyct = this.toneOkyct(t, { gamut: 'srgb' })
      colorHex = okyctToHex(okyct)
    }

    setLru(this.hexCache, cacheKey, colorHex, this.maxCacheSize)
    return colorHex
  }

  toneCss(toneValue: number, format: CssColorFormat = 'oklch'): string {
    if (!CssColorFormats.includes(format)) {
      throw new Error(`Invalid CSS color format: "${String(format)}". Expected one of: ${CssColorFormats.join(', ')}.`)
    }
    if (format === 'hex') {
      return this.tone(toneValue)
    }
    if (format === 'oklch') {
      return okyctToOklchCss(this.toneOkyct(toneValue, { gamut: this.gamut }))
    }
    return okyctToDisplayP3Css(this.toneOkyct(toneValue, { gamut: 'display-p3' }))
  }

  getAllTones(): Record<StandardTone, string> {
    const result: Partial<Record<StandardTone, string>> = {}
    for (const t of StandardTones) {
      result[t] = this.tone(t)
    }
    return result as Record<StandardTone, string>
  }
}
