import test from 'node:test'
import assert from 'node:assert/strict'
import { generateOkyctSemanticRoles } from './generate-okyct-roles.ts'

test('generateOkyctSemanticRoles generates light and dark semantic role maps', () => {
  const roles = generateOkyctSemanticRoles('#2563EB')
  assert.match(roles.light.primary, /^#[0-9a-f]{6}$/i)
  assert.match(roles.dark.surface, /^#[0-9a-f]{6}$/i)
})
