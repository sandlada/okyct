import test from 'node:test'
import assert from 'node:assert/strict'
import { kebabCase } from './kebab-case.ts'

test('page/internal/kebab-case converts camelCase to kebab-case', () => {
  assert.equal(kebabCase('surfaceContainerHigh'), 'surface-container-high')
})
