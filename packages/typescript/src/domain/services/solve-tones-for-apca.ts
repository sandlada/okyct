import type { ColorToneInput, ContrastSolution } from '../models/index.ts'
import { getApcaContrast } from './get-apca-contrast.ts'
import { toneToY } from './tone-to-y.ts'
import { yToTone } from './y-to-tone.ts'
import { resolveToneInput } from './internal/resolve-tone-input.ts'

const ApcaBlkThrs = 0.022
const ApcaBlkClmp = 1.414
const ApcaLoClip = 0.1
const ApcaLoConOffset = 0.027
const ApcaScale = 1.14
const ApcaMinFloorY = Math.pow(ApcaBlkThrs, ApcaBlkClmp)
const ApcaToneMargin = 0.35

function softClampY(y: number): number {
  return y < ApcaBlkThrs ? y + Math.pow(ApcaBlkThrs - y, ApcaBlkClmp) : y
}

function invertSoftClampY(ySoft: number): number {
  if (ySoft >= ApcaBlkThrs) return ySoft
  if (ySoft <= ApcaMinFloorY) return 0

  let y = Math.max(0, Math.min(ApcaBlkThrs, ySoft * 0.7))
  for (let i = 0; i < 6; i++) {
    const f = y + Math.pow(ApcaBlkThrs - y, ApcaBlkClmp) - ySoft
    if (Math.abs(f) < 1e-12) break
    const df = 1 - ApcaBlkClmp * Math.pow(ApcaBlkThrs - y, ApcaBlkClmp - 1)
    y = Math.max(0, Math.min(ApcaBlkThrs, y - f / df))
  }
  return y
}

export function solveTonesForApca(
  bgToneOrColor: ColorToneInput,
  targetLc = 60
): ContrastSolution {
  const bgTone = resolveToneInput(bgToneOrColor)
  if (!Number.isFinite(targetLc) || targetLc < 0 || targetLc > 108) {
    throw new Error(`Invalid targetLc: ${targetLc}. Expected a finite number in [0, 108].`)
  }
  if (targetLc === 0) {
    return { darkForegroundTone: Math.floor(bgTone), lightForegroundTone: Math.ceil(bgTone) }
  }

  const bgYSoft = softClampY(toneToY(bgTone))
  const sapcRequired = Math.max(ApcaLoClip, targetLc / 100 + ApcaLoConOffset)

  let darkTone: number | null = null
  const darkTerm = Math.pow(bgYSoft, 0.56) - sapcRequired / ApcaScale
  let darkCandidate = 0
  let darkLc: number
  if (darkTerm >= 0) {
    const txtYSoft = Math.pow(darkTerm, 1 / 0.57)
    const rawY = invertSoftClampY(txtYSoft)
    darkCandidate = Math.max(0, Math.floor(yToTone(rawY) - ApcaToneMargin))
    darkLc = Math.abs(getApcaContrast(darkCandidate, bgTone))
    while (darkCandidate > 0 && darkLc < targetLc) {
      darkCandidate--
      darkLc = Math.abs(getApcaContrast(darkCandidate, bgTone))
    }
  } else {
    darkLc = Math.abs(getApcaContrast(0, bgTone))
  }
  if (darkLc >= targetLc) {
    darkTone = darkCandidate
  }

  let lightTone: number | null = null
  const lightTerm = Math.pow(bgYSoft, 0.65) + sapcRequired / ApcaScale
  let lightCandidate = 100
  let lightLc: number
  if (lightTerm <= 1.0) {
    const txtYSoft = Math.min(1.0, Math.pow(Math.max(0, lightTerm), 1 / 0.62))
    const rawY = invertSoftClampY(txtYSoft)
    lightCandidate = Math.min(100, Math.ceil(yToTone(rawY) + ApcaToneMargin))
    lightLc = Math.abs(getApcaContrast(lightCandidate, bgTone))
    while (lightCandidate < 100 && lightLc < targetLc) {
      lightCandidate++
      lightLc = Math.abs(getApcaContrast(lightCandidate, bgTone))
    }
  } else {
    lightLc = Math.abs(getApcaContrast(100, bgTone))
  }
  if (lightLc >= targetLc) {
    lightTone = lightCandidate
  }

  return {
    darkForegroundTone: darkTone,
    lightForegroundTone: lightTone,
  }
}
