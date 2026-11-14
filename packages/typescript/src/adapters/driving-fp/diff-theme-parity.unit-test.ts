import test from 'node:test'
import assert from 'node:assert/strict'
import { diffThemeParity } from './diff-theme-parity.ts'

test('diffThemeParity detects missing and extra keys between two token dictionaries', () => {
  const diff = diffThemeParity({ primary: '#2563EB', surface: '#FFFFFF' })({
    primary: '#2563EB',
    accent: '#10B981',
  })
  assert.equal(diff.isSymmetric, false)
  assert.equal(diff.asymmetryKeys.length, 2)
})
