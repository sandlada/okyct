
import type { ColorToneInput } from '../models/index.ts'
import { toneToY } from './tone-to-y.ts'
import { resolveToneInput } from './internal/resolve-tone-input.ts'

export function getContrastRatio(toneOrColorA: ColorToneInput, toneOrColorB: ColorToneInput): number {
  const yA = toneToY(resolveToneInput(toneOrColorA))
  const yB = toneToY(resolveToneInput(toneOrColorB))
  const lighter = Math.max(yA, yB)
  const darker = Math.min(yA, yB)
  return (lighter + 0.05) / (darker + 0.05)
}
