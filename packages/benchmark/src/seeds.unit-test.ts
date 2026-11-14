import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BrandSeedHexes,
  NeutralSeedHexes,
  StressSeedHexes,
  buildSeedSuite,
  seedSuiteHash,
} from './seeds.ts'

test('seeds.ts builds deterministic seed suite and FNV-1a hash', () => {
  assert.ok(StressSeedHexes.length > 0)
  assert.ok(NeutralSeedHexes.length > 0)
  assert.ok(BrandSeedHexes.length > 0)
  const suite = buildSeedSuite()
  assert.ok(suite.length > 20)
  assert.equal(seedSuiteHash(suite), seedSuiteHash(suite))
})
