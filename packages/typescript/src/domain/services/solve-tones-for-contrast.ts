
import type { ColorToneInput, ContrastSolution } from '../models/index.ts'
import { toneToY } from './tone-to-y.ts'
import { yToTone } from './y-to-tone.ts'
import { resolveToneInput } from './internal/resolve-tone-input.ts'

const QuantizationToneMargin = 0.35

export function solveTonesForContrast(
  bgToneOrColor: ColorToneInput,
  targetRatio = 4.5
): ContrastSolution {
  const bgTone = resolveToneInput(bgToneOrColor)
  if (!Number.isFinite(bgTone) || bgTone < 0 || bgTone > 100) {
    throw new Error(`Invalid bgTone: ${bgTone}. Expected a finite number in [0, 100].`)
  }
  if (!Number.isFinite(targetRatio) || targetRatio < 1 || targetRatio > 21) {
    throw new Error(`Invalid targetRatio: ${targetRatio}. Expected a finite number in [1, 21].`)
  }

  const bgY = toneToY(bgTone)

  const darkTargetY = (bgY + 0.05) / targetRatio - 0.05
  const darkTone = darkTargetY >= 0
    ? Math.max(0, Math.floor(yToTone(darkTargetY) - QuantizationToneMargin))
    : null

  const lightTargetY = targetRatio * (bgY + 0.05) - 0.05
  const lightTone = lightTargetY <= 1.0
    ? Math.min(100, Math.ceil(yToTone(lightTargetY) + QuantizationToneMargin))
    : null

  return {
    darkForegroundTone: darkTone,
    lightForegroundTone: lightTone,
  }
}
