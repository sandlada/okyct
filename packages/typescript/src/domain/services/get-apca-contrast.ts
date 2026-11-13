
import type { ColorToneInput } from '../models/index.ts'
import { toneToY } from './tone-to-y.ts'
import { resolveToneInput } from './internal/resolve-tone-input.ts'

const ApcaBlkThrs = 0.022
const ApcaBlkClmp = 1.414
const ApcaDeltaYMin = 0.0005
const ApcaLoClip = 0.1
const ApcaLoConOffset = 0.027
const ApcaScale = 1.14

export function getApcaContrast(txtToneOrColor: ColorToneInput, bgToneOrColor: ColorToneInput): number {
  let txtY = toneToY(resolveToneInput(txtToneOrColor))
  let bgY = toneToY(resolveToneInput(bgToneOrColor))

  if (txtY < ApcaBlkThrs) {
    txtY += Math.pow(ApcaBlkThrs - txtY, ApcaBlkClmp)
  }
  if (bgY < ApcaBlkThrs) {
    bgY += Math.pow(ApcaBlkThrs - bgY, ApcaBlkClmp)
  }

  if (Math.abs(bgY - txtY) < ApcaDeltaYMin) return 0

  if (bgY > txtY) {
    const sapc = (Math.pow(bgY, 0.56) - Math.pow(txtY, 0.57)) * ApcaScale
    if (sapc < ApcaLoClip) return 0
    return Math.round((sapc - ApcaLoConOffset) * 100)
  } else {
    const sapc = (Math.pow(bgY, 0.65) - Math.pow(txtY, 0.62)) * ApcaScale
    if (sapc > -ApcaLoClip) return 0
    return Math.round((sapc + ApcaLoConOffset) * 100)
  }
}
