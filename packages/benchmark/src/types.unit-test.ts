import test from 'node:test'
import assert from 'node:assert/strict'
import { BenchmarkModelIds, CvdTypes, type BenchmarkModelId } from './types.ts'

test('types.ts defines BenchmarkModelIds and CvdTypes', () => {
  assert.deepEqual(BenchmarkModelIds, ['okyct', 'google-mcu', 'culori'])
  const id: BenchmarkModelId = 'okyct'
  assert.ok(BenchmarkModelIds.includes(id))
  assert.ok(CvdTypes.includes('deuteranopia'))
})
