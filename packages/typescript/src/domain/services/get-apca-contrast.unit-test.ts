import test from 'node:test'
import assert from 'node:assert/strict'
import { getApcaContrast } from './get-apca-contrast.ts'

test('getApcaContrast returns positive Lc for dark text on light bg and negative for light on dark', () => {
  const darkOnLight = getApcaContrast(0, 100)
  const lightOnDark = getApcaContrast(100, 0)
  const same = getApcaContrast(50, 50)

  assert.ok(darkOnLight > 100)
  assert.ok(lightOnDark < -100)
  assert.equal(same, 0)
})
