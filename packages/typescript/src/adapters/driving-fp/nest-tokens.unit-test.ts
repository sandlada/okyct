import test from 'node:test'
import assert from 'node:assert/strict'
import { nestTokens } from './nest-tokens.ts'

test('nestTokens expands flat delimited keys into nested object', () => {
  const out = nestTokens('-')({
    'color-primary': '#2563EB',
    'color-surface': '#FFFFFF',
  })
  assert.deepEqual(out, {
    color: { primary: '#2563EB', surface: '#FFFFFF' },
  })
})

test('nestTokens preserves parent $value alongside child keys while throwing on path collisions', () => {
  const coexisting = nestTokens('-')({
    brand: '#111111',
    'brand-blue': '#2563EB',
  })
  assert.deepEqual(coexisting, {
    brand: { $value: '#111111', blue: '#2563EB' },
  })

  assert.throws(
    () => nestTokens('-')({ 'brand--blue': 'red', 'brand-blue': 'blue' }),
    /Token path collision/
  )
  assert.throws(
    () => nestTokens('-')({ 'brand-blue': 'blue', 'brand--blue': 'red' }),
    /Token path collision/
  )
  assert.throws(
    () => nestTokens('-')({ '--brand-blue': 'red', 'brand-blue': 'blue' }),
    /Token path collision/
  )
  assert.throws(
    () => nestTokens('-')({ brand: 'red', 'brand-$value': 'blue' }),
    /Token path collision/
  )
  assert.throws(
    () => nestTokens('-')({ '---': 'red' }),
    /produces no path segments/
  )
})
