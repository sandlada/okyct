/**
 * [Application — module internal]
 * Bracketed binary-search tone refinement for exact hex contrast closure.
 */

export interface RefineToneForContrastParams {
  startTone: number
  limitTone: number
  resolveHex: (tone: number) => string
  passes: (candidateHex: string) => boolean
  tolerance?: number
  maxIterations?: number
}

export interface RefineToneForContrastResult {
  tone: number
  hex: string
  passed: boolean
}

export function refineToneForContrast(
  params: RefineToneForContrastParams
): RefineToneForContrastResult {
  const {
    startTone,
    limitTone,
    resolveHex,
    passes,
    tolerance = 0.05,
    maxIterations = 12,
  } = params

  const startHex = resolveHex(startTone)
  if (passes(startHex)) {
    return { tone: startTone, hex: startHex, passed: true }
  }

  if (startTone === limitTone) {
    return { tone: startTone, hex: startHex, passed: false }
  }

  const limitHex = resolveHex(limitTone)
  if (!passes(limitHex)) {
    return { tone: limitTone, hex: limitHex, passed: false }
  }

  let failTone = startTone
  let passTone = limitTone
  let bestHex = limitHex

  for (let i = 0; i < maxIterations && Math.abs(passTone - failTone) > tolerance; i++) {
    const mid = (failTone + passTone) * 0.5
    const midHex = resolveHex(mid)
    if (passes(midHex)) {
      passTone = mid
      bestHex = midHex
    } else {
      failTone = mid
    }
  }

  return { tone: passTone, hex: bestHex, passed: true }
}
