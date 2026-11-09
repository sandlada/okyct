
import { toneToY } from './tone-to-y.ts'

export function getApcaContrast(txtTone: number, bgTone: number): number {
  const txtY = toneToY(txtTone)
  const bgY = toneToY(bgTone)

  const deltaY = txtY - bgY
  const absDelta = Math.abs(deltaY)
  if (absDelta < 0.0005) return 0

  let sapc = 0
  if (bgY > txtY) {
    const yBgExp = Math.pow(bgY, 0.56)
    const yTxtExp = Math.pow(txtY, 0.57)
    sapc = (yBgExp - yTxtExp) * 1.14
  } else {
    const yBgExp = Math.pow(bgY, 0.65)
    const yTxtExp = Math.pow(txtY, 0.62)
    sapc = (yBgExp - yTxtExp) * 1.14
  }

  return Math.round(sapc * 100)
}
