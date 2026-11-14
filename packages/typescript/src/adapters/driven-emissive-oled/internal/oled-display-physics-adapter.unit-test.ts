import test from 'node:test'
import assert from 'node:assert/strict'
import { OledDisplayPhysicsAdapter, OledDisplayPhysicsSingleton } from './oled-display-physics-adapter.ts'

test('OledDisplayPhysicsAdapter and singleton implement IDisplayPhysicsPort methods', () => {
  const adapter = new OledDisplayPhysicsAdapter()
  assert.equal(OledDisplayPhysicsSingleton instanceof OledDisplayPhysicsAdapter, true)
  assert.equal(adapter.computeColorEmissiveTelemetry('#000000').powerMw, 0)
  assert.match(adapter.applyBlueBurnInGuard('#2563EB'), /^#[0-9a-f]{6}$/i)
})
