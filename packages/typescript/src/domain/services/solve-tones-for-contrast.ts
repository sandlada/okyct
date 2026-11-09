
import type { ContrastSolution } from '../models/index.ts'
import { toneToY } from './tone-to-y.ts'
import { yToTone } from './y-to-tone.ts'

export function solveTonesForContrast(
  bgTone: number,
  targetRatio: number
): ContrastSolution {
  const bgY = toneToY(bgTone)

  const darkTargetY = (bgY + 0.05) / targetRatio - 0.05
  const darkTone = darkTargetY >= 0 ? yToTone(darkTargetY) : null

  const lightTargetY = targetRatio * (bgY + 0.05) - 0.05
  const lightTone = lightTargetY <= 1.0 ? yToTone(lightTargetY) : null

  return {
    darkForegroundTone: darkTone !== null ? Math.floor(darkTone) : null,
    lightForegroundTone: lightTone !== null ? Math.ceil(lightTone) : null,
  }
}
