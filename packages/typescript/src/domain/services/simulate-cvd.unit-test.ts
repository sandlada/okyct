import test from 'node:test'
import assert from 'node:assert/strict'
import { simulateCvd } from './simulate-cvd.ts'

test('simulateCvd preserves color for none and transforms for protanopia/deuteranopia/tritanopia/achromatopsia', () => {
  assert.equal(simulateCvd('#2563EB', 'none').toLowerCase(), '#2563eb')
  assert.match(simulateCvd('#EF4444', 'protanopia'), /^#[0-9a-f]{6}$/i)
  assert.match(simulateCvd('#10B981', 'deuteranopia'), /^#[0-9a-f]{6}$/i)
  assert.match(simulateCvd('#2563EB', 'tritanopia'), /^#[0-9a-f]{6}$/i)

  const gray = simulateCvd('#EF4444', 'achromatopsia')
  assert.equal(gray.slice(1, 3), gray.slice(3, 5))
  assert.equal(gray.slice(3, 5), gray.slice(5, 7))
})
