/**
 * [Domain Service — module internal]
 * 将 Tone 数值、Hex 颜色字符串或 OKYCT 坐标统一归一化为 Tone [0, 100]
 */

import type { ColorToneInput } from '../../models/index.ts'
import { yToTone } from '../y-to-tone.ts'
import { parseHexToRgb24, SrgbByteToLinearLut } from './srgb-lut.ts'

export function resolveToneInput(input: ColorToneInput): number {
  let tone: number
  if (typeof input === 'number') {
    tone = input
  } else if (typeof input === 'string') {
    const rgb24 = parseHexToRgb24(input)
    const r8 = (rgb24 >> 16) & 255
    const g8 = (rgb24 >> 8) & 255
    const b8 = rgb24 & 255
    const rl = SrgbByteToLinearLut[r8]
    const y =
      r8 === g8 && g8 === b8
        ? rl
        : 0.2126729 * rl + 0.7151522 * SrgbByteToLinearLut[g8] + 0.0721750 * SrgbByteToLinearLut[b8]
    tone = yToTone(y)
  } else if (input !== null && typeof input === 'object' && typeof input.t === 'number') {
    tone = input.t
  } else {
    throw new Error(`Invalid tone input: expected a Tone number in [0, 100], Hex string, or OKYCT object.`)
  }

  if (!Number.isFinite(tone) || tone < 0 || tone > 100) {
    throw new Error(`Invalid tone value: ${tone}. Expected a finite number in [0, 100].`)
  }

  return tone
}
