import test from 'node:test'
import assert from 'node:assert/strict'
import type { ColorConversionOptions } from './color-conversion-options.model.ts'

test('ColorConversionOptions accepts gamut and gamutMapping options', () => {
  const opts: ColorConversionOptions = {
    gamut: 'display-p3',
    gamutMapping: 'cusp-compress',
  }
  assert.equal(opts.gamut, 'display-p3')
  assert.equal(opts.gamutMapping, 'cusp-compress')
})
