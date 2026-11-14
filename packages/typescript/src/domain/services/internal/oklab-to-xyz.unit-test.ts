import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { oklabToXyz } from './oklab-to-xyz.ts'
import { xyzToOklab } from './xyz-to-oklab.ts'

describe('oklabToXyz', () => {
  it('maps zero to zero and roundtrips chromatic OKLab values with xyzToOklab', () => {
    assert.deepEqual(oklabToXyz({ L: 0, a: 0, b: 0 }), { x: 0, y: 0, z: 0 })

    const lab = { L: 0.65, a: 0.05, b: -0.1 }
    const back = xyzToOklab(oklabToXyz(lab))
    assert.ok(Math.abs(back.L - lab.L) < 1e-5)
    assert.ok(Math.abs(back.a - lab.a) < 1e-5)
    assert.ok(Math.abs(back.b - lab.b) < 1e-5)
  })
})
