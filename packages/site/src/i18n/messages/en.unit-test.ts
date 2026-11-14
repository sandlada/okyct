import test from 'node:test'
import assert from 'node:assert/strict'
import { EnglishMessages } from './en.ts'

test('EnglishMessages provides non-empty strings for all message keys', () => {
  const keys = Object.keys(EnglishMessages) as Array<keyof typeof EnglishMessages>
  assert.ok(keys.length > 20)
  for (const key of keys) {
    assert.equal(typeof EnglishMessages[key], 'string')
    assert.ok(EnglishMessages[key].length > 0)
  }
})
