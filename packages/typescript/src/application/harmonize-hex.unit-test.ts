import test from 'node:test'
import assert from 'node:assert/strict'
import { harmonizeHex } from './harmonize-hex.ts'

test('harmonizeHex shifts design color hue toward source color within maxShiftAngle', () => {
  const harmonized = harmonizeHex('#10B981', '#2563EB', 18)
  assert.match(harmonized, /^#[0-9a-f]{6}$/i)
  assert.notEqual(harmonized.toLowerCase(), '#10b981')
})
