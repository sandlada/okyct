import { rgbToOkyct, okyctToHex, shortestHueDelta } from '../../domain/index.ts'
import {
  ImageQuantizerModes,
  type ExtractedSeedColor,
  type ExtractSeedsOptions,
  type ImagePixelBuffer,
  type ImageQuantizerMode,
} from '../../ports/outbound/image-quantizer.port.ts'

export { ImageQuantizerModes, type ImageQuantizerMode, type ExtractSeedsOptions }

const DefaultMaxColors = 4
const DefaultMinHueDistance = 28
const DefaultMinToneDistance = 22
const GridHueBins = 72
const GridToneBands = 5
const DegToRad = Math.PI / 180
const RadToDeg = 180 / Math.PI

const FallbackSeed: ExtractedSeedColor = {
  hex: '#1A73E8',
  okyct: { h: 256, c: 0.16, t: 48 },
  populationRatio: 1,
  salienceScore: 100,
}

interface SeedCandidate {
  hue: number
  score: number
  avgC: number
  avgT: number
  popRatio: number
}

function extractHueHistogramSeeds(
  data: Uint8ClampedArray | readonly number[],
  maxColors: number,
  minHueDistance: number
): ExtractedSeedColor[] {
  const hueBins = new Float64Array(360)
  const chromaSum = new Float64Array(360)
  const toneSum = new Float64Array(360)

  let totalOpaquePixels = 0
  let validPixels = 0

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    totalOpaquePixels++

    const okyct = rgbToOkyct({
      r: data[i] / 255,
      g: data[i + 1] / 255,
      b: data[i + 2] / 255,
    })

    if (okyct.t < 10 || okyct.t > 95 || okyct.c < 0.028) continue

    const bin = Math.floor(okyct.h) % 360
    hueBins[bin] += 1
    chromaSum[bin] += okyct.c
    toneSum[bin] += okyct.t
    validPixels++
  }

  if (validPixels === 0 || totalOpaquePixels === 0) {
    return [{ ...FallbackSeed, okyct: { ...FallbackSeed.okyct } }]
  }

  const scores: SeedCandidate[] = []

  for (let h = 0; h < 360; h++) {
    if (hueBins[h] === 0) continue

    let neighborPop = 0
    let rawClusterPop = 0
    let weightedChroma = 0
    let weightedTone = 0

    for (let offset = -7; offset <= 7; offset++) {
      const idx = (h + offset + 360) % 360
      const weight = 1 - Math.abs(offset) / 9
      neighborPop += hueBins[idx] * weight
      rawClusterPop += hueBins[idx]
      weightedChroma += chromaSum[idx] * weight
      weightedTone += toneSum[idx] * weight
    }

    const avgC = weightedChroma / neighborPop
    const avgT = weightedTone / neighborPop
    const popRatio = rawClusterPop / totalOpaquePixels

    const chromaFactor = Math.pow(Math.min(0.28, avgC) / 0.14, 1.15)
    const tonePenalty = avgT < 20 || avgT > 85 ? 0.65 : 1.0
    const score = (neighborPop / validPixels) * 100 * chromaFactor * tonePenalty

    scores.push({ hue: h, score, avgC, avgT, popRatio })
  }

  scores.sort((a, b) => b.score - a.score)

  const selected: ExtractedSeedColor[] = []
  for (const candidate of scores) {
    const isTooClose = selected.some(
      (existing) => shortestHueDelta(existing.okyct.h, candidate.hue) < minHueDistance
    )

    if (!isTooClose) {
      const clampedT = Math.max(35, Math.min(72, candidate.avgT))
      const clampedC = Math.max(0.08, Math.min(0.24, candidate.avgC))
      const hex = okyctToHex({ h: candidate.hue, c: clampedC, t: clampedT })

      selected.push({
        hex,
        okyct: { h: candidate.hue, c: clampedC, t: clampedT },
        populationRatio: Math.min(1, candidate.popRatio),
        salienceScore: Math.round(candidate.score * 10) / 10,
      })

      if (selected.length >= maxColors) break
    }
  }

  return selected
}

function extractHueToneGridSeeds(
  data: Uint8ClampedArray | readonly number[],
  maxColors: number,
  minHueDistance: number,
  minToneDistance: number
): ExtractedSeedColor[] {
  const totalCells = GridHueBins * GridToneBands
  const cellCount = new Float64Array(totalCells)
  const cellChromaSum = new Float64Array(totalCells)
  const cellToneSum = new Float64Array(totalCells)
  const cellCosSum = new Float64Array(totalCells)
  const cellSinSum = new Float64Array(totalCells)

  let totalOpaquePixels = 0
  let validPixels = 0

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    totalOpaquePixels++

    const okyct = rgbToOkyct({
      r: data[i] / 255,
      g: data[i + 1] / 255,
      b: data[i + 2] / 255,
    })

    if (okyct.t < 10 || okyct.t > 95 || okyct.c < 0.028) continue

    const hBin = Math.floor(okyct.h / 5) % GridHueBins
    const tBand = Math.min(GridToneBands - 1, Math.floor(okyct.t / 20))
    const cell = hBin * GridToneBands + tBand
    const rad = okyct.h * DegToRad

    cellCount[cell] += 1
    cellChromaSum[cell] += okyct.c
    cellToneSum[cell] += okyct.t
    cellCosSum[cell] += Math.cos(rad)
    cellSinSum[cell] += Math.sin(rad)
    validPixels++
  }

  if (validPixels === 0 || totalOpaquePixels === 0) {
    return [{ ...FallbackSeed, okyct: { ...FallbackSeed.okyct } }]
  }

  const scores: SeedCandidate[] = []

  for (let hBin = 0; hBin < GridHueBins; hBin++) {
    for (let tBand = 0; tBand < GridToneBands; tBand++) {
      const centerCell = hBin * GridToneBands + tBand
      if (cellCount[centerCell] === 0) continue

      let weightedPop = 0
      let rawClusterPop = 0
      let weightedChroma = 0
      let weightedTone = 0
      let weightedCos = 0
      let weightedSin = 0

      for (let dh = -1; dh <= 1; dh++) {
        const nh = (hBin + dh + GridHueBins) % GridHueBins
        const hWeight = dh === 0 ? 1.0 : 0.5
        for (let dt = -1; dt <= 1; dt++) {
          const nt = tBand + dt
          if (nt < 0 || nt >= GridToneBands) continue
          const tWeight = dt === 0 ? 1.0 : 0.25
          const weight = hWeight * tWeight
          const nCell = nh * GridToneBands + nt
          const count = cellCount[nCell]
          if (count === 0) continue

          weightedPop += count * weight
          rawClusterPop += count
          weightedChroma += cellChromaSum[nCell] * weight
          weightedTone += cellToneSum[nCell] * weight
          weightedCos += cellCosSum[nCell] * weight
          weightedSin += cellSinSum[nCell] * weight
        }
      }

      const avgC = weightedChroma / weightedPop
      const avgT = weightedTone / weightedPop
      let meanHue = Math.atan2(weightedSin, weightedCos) * RadToDeg
      if (meanHue < 0) meanHue += 360
      const popRatio = rawClusterPop / totalOpaquePixels

      const chromaFactor = Math.pow(Math.min(0.28, avgC) / 0.14, 1.15)
      const tonePenalty = avgT < 16 || avgT > 88 ? 0.7 : 1.0
      const score = (weightedPop / validPixels) * 100 * chromaFactor * tonePenalty

      scores.push({ hue: meanHue, score, avgC, avgT, popRatio })
    }
  }

  scores.sort((a, b) => b.score - a.score)

  const selected: ExtractedSeedColor[] = []
  for (const candidate of scores) {
    const clampedT = Math.max(20, Math.min(82, candidate.avgT))
    const clampedC = Math.max(0.08, Math.min(0.24, candidate.avgC))
    const isTooClose = selected.some(
      (existing) =>
        shortestHueDelta(existing.okyct.h, candidate.hue) < minHueDistance &&
        Math.abs(existing.okyct.t - clampedT) < minToneDistance
    )

    if (!isTooClose) {
      const roundedH = Math.round(candidate.hue * 100) / 100
      const hex = okyctToHex({ h: roundedH, c: clampedC, t: clampedT })

      selected.push({
        hex,
        okyct: { h: roundedH, c: clampedC, t: clampedT },
        populationRatio: Math.min(1, candidate.popRatio),
        salienceScore: Math.round(candidate.score * 10) / 10,
      })

      if (selected.length >= maxColors) break
    }
  }

  return selected
}

export function extractSeedsFromImageData(
  imageData: ImagePixelBuffer,
  options: ExtractSeedsOptions = {}
): ExtractedSeedColor[] {
  if (
    imageData === null ||
    typeof imageData !== 'object' ||
    imageData.data === null ||
    imageData.data === undefined ||
    typeof imageData.data.length !== 'number'
  ) {
    throw new Error('Invalid imageData input: expected an ImagePixelBuffer object with a data array.')
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid extractSeedsFromImageData options: expected an ExtractSeedsOptions object.')
  }

  const maxColors = options.maxColors ?? DefaultMaxColors
  if (!Number.isFinite(maxColors) || maxColors < 1) {
    throw new Error(`Invalid maxColors: ${maxColors}. Expected a finite number >= 1.`)
  }
  const mode: ImageQuantizerMode = options.mode ?? 'hue-tone-grid'
  if (!ImageQuantizerModes.includes(mode)) {
    throw new Error(
      `Invalid image quantizer mode: "${String(mode)}". Expected one of: ${ImageQuantizerModes.join(', ')}.`
    )
  }
  const minHueDistance = options.minHueDistance ?? DefaultMinHueDistance
  if (!Number.isFinite(minHueDistance) || minHueDistance < 0) {
    throw new Error(`Invalid minHueDistance: ${minHueDistance}. Expected a non-negative finite number.`)
  }
  const minToneDistance = options.minToneDistance ?? DefaultMinToneDistance
  if (!Number.isFinite(minToneDistance) || minToneDistance < 0) {
    throw new Error(`Invalid minToneDistance: ${minToneDistance}. Expected a non-negative finite number.`)
  }

  if (mode === 'hue-histogram') {
    return extractHueHistogramSeeds(imageData.data, maxColors, minHueDistance)
  }
  return extractHueToneGridSeeds(imageData.data, maxColors, minHueDistance, minToneDistance)
}
