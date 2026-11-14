import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DarkSemanticRoleToneTargets,
  LightSemanticRoleToneTargets,
  SemanticContrastPairCount,
  SemanticContrastRolePairs,
  SemanticContrastRoleTokens,
} from './semantic-role-contract.ts'

test('semantic-role-contract defines role tokens, contrast pairs, and tone targets', () => {
  assert.ok(SemanticContrastRoleTokens.includes('primary'))
  assert.equal(SemanticContrastRolePairs.length, SemanticContrastPairCount)
  assert.equal(LightSemanticRoleToneTargets.primary, 40)
  assert.equal(DarkSemanticRoleToneTargets.primary, 80)
})
