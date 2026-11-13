/**
 * [Domain Service — module internal]
 * 将 Tone 数值、Hex 颜色字符串或 OKYCT 坐标统一归一化为 Tone [0, 100]
 */

import type { ColorToneInput } from '../../models/index.ts'
import { hexToOkyct } from '../hex-to-okyct.ts'

export function resolveToneInput(input: ColorToneInput): number {
  let tone: number
  if (typeof input === 'number') {
    tone = input
  } else if (typeof input === 'string') {
    tone = hexToOkyct(input).t
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
