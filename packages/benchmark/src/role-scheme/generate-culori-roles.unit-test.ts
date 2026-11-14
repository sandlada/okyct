import test from 'node:test'
import assert from 'node:assert/strict'
import { generateCuloriSemanticRoles } from './generate-culori-roles.ts'

test('generateCuloriSemanticRoles generates light and dark semantic role maps', () => {
  const roles = generateCuloriSemanticRoles('#2563EB')
  assert.match(roles.light.primary, /^#[0-9a-f]{6}$/i)
  assert.match(roles.dark.surface, /^#[0-9a-f]{6}$/i)
})
