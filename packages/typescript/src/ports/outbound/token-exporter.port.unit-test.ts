import test from 'node:test'
import assert from 'node:assert/strict'
import { CssSchemeModes, TailwindFallbackModes } from './token-exporter.port.ts'

test('token-exporter port defines CssSchemeModes and TailwindFallbackModes', () => {
  assert.deepEqual(CssSchemeModes, ['class', 'light-dark'])
  assert.deepEqual(TailwindFallbackModes, ['none', 'light-dark'])
})
