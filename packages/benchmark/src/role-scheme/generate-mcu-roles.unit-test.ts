import test from 'node:test'
import assert from 'node:assert/strict'
import { generateMcuSemanticRoles } from './generate-mcu-roles.ts'

test('generateMcuSemanticRoles generates light and dark semantic role maps', () => {
  const roles = generateMcuSemanticRoles('#2563EB')
  assert.match(roles.light.primary, /^#[0-9a-f]{6}$/i)
  assert.match(roles.dark.surface, /^#[0-9a-f]{6}$/i)
})
