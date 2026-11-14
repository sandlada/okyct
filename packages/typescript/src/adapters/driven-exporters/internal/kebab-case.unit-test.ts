import test from 'node:test'
import assert from 'node:assert/strict'
import { kebabCase } from './kebab-case.ts'

test('kebabCase converts camelCase, PascalCase, and spaces to kebab-case', () => {
  assert.equal(kebabCase('onPrimaryContainer'), 'on-primary-container')
  assert.equal(kebabCase('SurfaceDim'), 'surface-dim')
  assert.equal(kebabCase('brand accent'), 'brand-accent')
})
