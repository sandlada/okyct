import test from 'node:test'
import assert from 'node:assert/strict'
import { compressToGamutCusp } from './compress-to-gamut-cusp.ts'

test('compressToGamutCusp maps out-of-gamut chroma into [0, 1] linear RGB', () => {
  const linear = compressToGamutCusp(145, 0.45, 60, 'srgb')
  assert.ok(linear.r >= -1e-4 && linear.r <= 1.0001)
  assert.ok(linear.g >= -1e-4 && linear.g <= 1.0001)
  assert.ok(linear.b >= -1e-4 && linear.b <= 1.0001)
})
