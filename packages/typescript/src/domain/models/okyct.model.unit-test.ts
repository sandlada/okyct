import test from 'node:test'
import assert from 'node:assert/strict'
import type { ColorToneInput, OKYCT } from './okyct.model.ts'

test('OKYCT and ColorToneInput represent h/c/t and flexible tone inputs', () => {
  const color: OKYCT = { h: 250, c: 0.14, t: 40 }
  const inputs: ColorToneInput[] = [40, '#2563EB', color]
  assert.equal(inputs.length, 3)
  assert.equal(color.h, 250)
})
