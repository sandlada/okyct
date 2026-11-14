import test from 'node:test'
import assert from 'node:assert/strict'
import { validateContract } from './validate-contract.ts'

test('validateContract reports valid=true when all required keys exist and missingKeys otherwise', () => {
  const ok = validateContract(['primary'])({ primary: '#2563EB', surface: '#FFFFFF' })
  assert.equal(ok.valid, true)
  assert.deepEqual(ok.missingKeys, [])

  const bad = validateContract(['primary', 'error'])({ primary: '#2563EB' })
  assert.equal(bad.valid, false)
  assert.deepEqual(bad.missingKeys, ['error'])
})
