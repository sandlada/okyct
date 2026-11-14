import test from 'node:test'
import assert from 'node:assert/strict'
import { oklabToXyz } from './oklab-to-xyz.ts'
import { xyzToOklab } from './xyz-to-oklab.ts'

test('oklabToXyz roundtrips with xyzToOklab', () => {
  const lab = { L: 0.65, a: 0.05, b: -0.1 }
  const back = xyzToOklab(oklabToXyz(lab))
  assert.ok(Math.abs(back.L - lab.L) < 1e-5)
  assert.ok(Math.abs(back.a - lab.a) < 1e-5)
  assert.ok(Math.abs(back.b - lab.b) < 1e-5)
})
