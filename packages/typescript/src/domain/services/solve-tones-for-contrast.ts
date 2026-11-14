import {
  ContrastMetrics,
  type ColorToneInput,
  type ContrastMetric,
  type ContrastSolution,
} from '../models/index.ts'
import { solveTonesForApca } from './solve-tones-for-apca.ts'
import { toneToY } from './tone-to-y.ts'
import { yToTone } from './y-to-tone.ts'
import { resolveToneInput } from './internal/resolve-tone-input.ts'

const QuantizationToneMargin = 0.35

function solveWcagOnly(bgTone: number, targetRatio: number): ContrastSolution {
  const bgY = toneToY(bgTone)

  const darkTargetY = (bgY + 0.05) / targetRatio - 0.05
  const darkTone = darkTargetY >= -1e-12
    ? Math.max(0, Math.floor(yToTone(Math.max(0, darkTargetY)) - QuantizationToneMargin))
    : null

  const lightTargetY = targetRatio * (bgY + 0.05) - 0.05
  const lightTone = lightTargetY <= 1.0 + 1e-12
    ? Math.min(100, Math.ceil(yToTone(Math.min(1.0, lightTargetY)) + QuantizationToneMargin))
    : null

  return {
    darkForegroundTone: darkTone,
    lightForegroundTone: lightTone,
  }
}

export function solveTonesForContrast(
  bgToneOrColor: ColorToneInput,
  targetRatio = 4.5,
  options: { metric?: ContrastMetric; targetLc?: number } = {}
): ContrastSolution {
  const bgTone = resolveToneInput(bgToneOrColor)
  if (!Number.isFinite(targetRatio) || targetRatio < 1 || targetRatio > 21) {
    throw new Error(`Invalid targetRatio: ${targetRatio}. Expected a finite number in [1, 21].`)
  }
  const metric = options.metric ?? 'wcag'
  if (!ContrastMetrics.includes(metric)) {
    throw new Error(`Invalid contrast metric: "${String(metric)}". Expected one of: ${ContrastMetrics.join(', ')}.`)
  }

  const targetLc = options.targetLc ?? (targetRatio >= 7.0 ? 75 : targetRatio >= 4.5 ? 60 : 45)

  if (metric === 'wcag') {
    return solveWcagOnly(bgTone, targetRatio)
  }
  if (metric === 'apca') {
    return solveTonesForApca(bgTone, targetLc)
  }

  const wcag = solveWcagOnly(bgTone, targetRatio)
  const apca = solveTonesForApca(bgTone, targetLc)

  const darkForegroundTone =
    wcag.darkForegroundTone !== null && apca.darkForegroundTone !== null
      ? Math.min(wcag.darkForegroundTone, apca.darkForegroundTone)
      : null

  const lightForegroundTone =
    wcag.lightForegroundTone !== null && apca.lightForegroundTone !== null
      ? Math.max(wcag.lightForegroundTone, apca.lightForegroundTone)
      : null

  return {
    darkForegroundTone,
    lightForegroundTone,
  }
}
