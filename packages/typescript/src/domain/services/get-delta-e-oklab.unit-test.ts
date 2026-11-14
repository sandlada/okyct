import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getDeltaEOklab } from './get-delta-e-oklab.ts'

describe('getDeltaEOklab', () => {
  it('satisfies metric space axioms (identity, symmetry, triangle inequality)', () => {
    const a = '#2563EB'
    const b = '#10B981'
    const c = '#EF4444'

    assert.equal(getDeltaEOklab(a, a), 0)
    assert.equal(getDeltaEOklab(a, b), getDeltaEOklab(b, a))
    assert.ok(getDeltaEOklab(a, c) <= getDeltaEOklab(a, b) + getDeltaEOklab(b, c) + 1e-12)
  })

  it('computes ~1.0 perceptual distance from black to white and small delta for near neighbors', () => {
    const bw = getDeltaEOklab('#000000', '#FFFFFF')
    assert.ok(bw > 0.99 && bw <= 1.01)

    const slight = getDeltaEOklab('#2563EB', '#2563EC')
    assert.ok(slight > 0 && slight < 0.01)
  })

  it('throws on invalid hex color inputs', () => {
    assert.throws(() => getDeltaEOklab('invalid', '#FFFFFF'), /Invalid hex/)
    assert.throws(() => getDeltaEOklab('#000000', 'invalid'), /Invalid hex/)
  })
})
