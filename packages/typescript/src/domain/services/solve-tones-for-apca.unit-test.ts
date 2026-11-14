import test from 'node:test'
import assert from 'node:assert/strict'
import { getApcaContrast } from './get-apca-contrast.ts'
import { solveTonesForApca } from './solve-tones-for-apca.ts'

test('solveTonesForApca returns dark/light foreground tones meeting target Lc', () => {
  const solLightBg = solveTonesForApca(95, 60)
  assert.ok(solLightBg.darkForegroundTone !== null)
  assert.ok(Math.abs(getApcaContrast(solLightBg.darkForegroundTone, 95)) >= 59.5)

  const solDarkBg = solveTonesForApca(10, 60)
  assert.ok(solDarkBg.lightForegroundTone !== null)
  assert.ok(Math.abs(getApcaContrast(solDarkBg.lightForegroundTone, 10)) >= 59.5)
})
