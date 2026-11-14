import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getDeltaE2000 } from './get-delta-e-2000.ts'

describe('getDeltaE2000', () => {
  it('satisfies identity, symmetry, and expected ranges on grayscale and subtle shifts', () => {
    assert.equal(getDeltaE2000('#2563EB', '#2563EB'), 0)
    assert.ok(Math.abs(getDeltaE2000('#2563EB', '#EF4444') - getDeltaE2000('#EF4444', '#2563EB')) < 1e-12)
    assert.ok(getDeltaE2000('#000000', '#FFFFFF') > 90)
    assert.ok(getDeltaE2000('#2563EB', '#2563EC') < 1)
  })

  it('handles achromatic pairs, 0/360 hue wrap-around, and the 275-degree blue rotation term', () => {
    const achromVsChrom = getDeltaE2000('#808080', '#2563EB')
    const achromVsAchrom = getDeltaE2000('#000000', '#808080')
    assert.ok(achromVsChrom > 20)
    assert.ok(achromVsAchrom > 30)

    const wrapLowSum = getDeltaE2000('#ff0020', '#ff2000')
    const wrapHighSum = getDeltaE2000('#c026d3', '#be123c')
    const wrapInverse = getDeltaE2000('#ff2000', '#ff0020')
    assert.ok(wrapLowSum > 0)
    assert.ok(wrapHighSum > 0)
    assert.ok(Math.abs(wrapLowSum - wrapInverse) < 1e-12)

    const blueRotation = getDeltaE2000('#1d4ed8', '#4338ca')
    assert.ok(blueRotation > 5 && blueRotation < 30)
  })

  it('throws on invalid hex color inputs', () => {
    assert.throws(() => getDeltaE2000('not-hex', '#FFFFFF'), /Invalid hex/)
    assert.throws(() => getDeltaE2000('#FFFFFF', 'not-hex'), /Invalid hex/)
  })
})
