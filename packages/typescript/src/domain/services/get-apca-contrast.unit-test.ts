import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getApcaContrast } from './get-apca-contrast.ts'

describe('getApcaContrast', () => {
  it('preserves APCA polarity (positive dark-on-light, negative light-on-dark)', () => {
    const darkOnLight = getApcaContrast(0, 100)
    const lightOnDark = getApcaContrast(100, 0)

    assert.equal(darkOnLight, 106)
    assert.equal(lightOnDark, -108)
  })

  it('clips below delta-Y and low-contrast SAPC thresholds to 0', () => {
    assert.equal(getApcaContrast(50, 50), 0)
    assert.equal(getApcaContrast(50, 52), 0)
    assert.equal(getApcaContrast(52, 50), 0)
  })

  it('handles soft black clamp below Y=0.022 and supports hex/OKYCT inputs', () => {
    const onSoftDark = getApcaContrast(5, 80)
    assert.ok(onSoftDark > 50)

    const lightTextOnSoftDark = getApcaContrast(90, 6)
    assert.ok(lightTextOnSoftDark < -60)

    assert.equal(
      getApcaContrast('#000000', '#FFFFFF'),
      getApcaContrast({ h: 220, c: 0, t: 0 }, { h: 220, c: 0, t: 100 }),
    )
  })

  it('throws on invalid text or background tone inputs', () => {
    assert.throws(() => getApcaContrast(-5, 90), /Invalid tone value/)
    assert.throws(() => getApcaContrast(10, 105), /Invalid tone value/)
    assert.throws(() => getApcaContrast('not-hex', 90), /Invalid hex/)
  })
})
