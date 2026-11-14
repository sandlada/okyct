import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { findCuspForMaxChroma } from './find-cusp-for-max-chroma.ts'

describe('findCuspForMaxChroma', () => {
  it('locates cusp tone and peak chroma across all 6 RGB cube edges for srgb and display-p3', () => {
    for (let h = 0; h < 360; h += 30) {
      const srgbCusp = findCuspForMaxChroma(h, 'srgb')
      const p3Cusp = findCuspForMaxChroma(h, 'display-p3')

      assert.ok(srgbCusp.tone > 5 && srgbCusp.tone < 98)
      assert.ok(srgbCusp.chroma > 0.1)
      assert.ok(p3Cusp.tone > 5 && p3Cusp.tone < 98)
      assert.ok(p3Cusp.chroma >= srgbCusp.chroma)
    }
  })

  it('defaults to srgb and wraps negative hues into [0, 360)', () => {
    assert.deepEqual(findCuspForMaxChroma(30), findCuspForMaxChroma(30, 'srgb'))
    const wrapped = findCuspForMaxChroma(-45, 'srgb')
    const canonical = findCuspForMaxChroma(315, 'srgb')
    assert.ok(Math.abs(wrapped.tone - canonical.tone) < 1e-6)
    assert.ok(Math.abs(wrapped.chroma - canonical.chroma) < 1e-6)
  })
})
