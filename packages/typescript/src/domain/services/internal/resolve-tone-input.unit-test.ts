import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveToneInput } from './resolve-tone-input.ts'

test('resolveToneInput accepts numeric tone, OKYCT object, and hex string', () => {
  assert.equal(resolveToneInput(42), 42)
  assert.equal(resolveToneInput({ h: 250, c: 0.1, t: 65 }), 65)
  const blackTone = resolveToneInput('#000000')
  assert.equal(blackTone, 0)
  const whiteTone = resolveToneInput('#FFFFFF')
  assert.ok(Math.abs(whiteTone - 100) < 1e-3)
})
