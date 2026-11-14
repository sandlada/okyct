import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getContrastRatio } from './get-contrast-ratio.ts'

describe('getContrastRatio', () => {
  it('computes exact WCAG 2.1 contrast bounds and symmetry', () => {
    assert.equal(getContrastRatio(0, 100), 21)
    assert.equal(getContrastRatio('#000000', '#FFFFFF'), 21)
    assert.equal(getContrastRatio('#FFFFFF', '#FFFFFF'), 1)
    assert.equal(getContrastRatio(50, 50), 1)
    assert.equal(getContrastRatio(40, 90), getContrastRatio(90, 40))
  })

  it('is strictly independent of hue and chroma for identical Tones', () => {
    const blueContrast = getContrastRatio({ h: 250, c: 0.2, t: 40 }, { h: 0, c: 0, t: 100 })
    const greenContrast = getContrastRatio({ h: 145, c: 0.18, t: 40 }, { h: 100, c: 0.05, t: 100 })
    const numericContrast = getContrastRatio(40, 100)

    assert.equal(blueContrast, numericContrast)
    assert.equal(greenContrast, numericContrast)
  })

  it('throws when given invalid ColorToneInput values', () => {
    assert.throws(() => getContrastRatio(-1, 100), /Invalid tone value/)
    assert.throws(() => getContrastRatio(0, 101), /Invalid tone value/)
    assert.throws(() => getContrastRatio('invalid', '#fff'), /Invalid hex/)
  })
})
