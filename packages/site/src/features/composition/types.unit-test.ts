import test from 'node:test'
import assert from 'node:assert/strict'
import { BlendSpaces, OperatorKinds, StackLayerRoles, blankStep } from './types.ts'

test('composition/types defines BlendSpaces, OperatorKinds, StackLayerRoles, and blankStep', () => {
  assert.deepEqual(BlendSpaces, ['linear-srgb', 'okyct', 'gamma-srgb'])
  assert.ok(OperatorKinds.length > 0)
  assert.ok(StackLayerRoles.includes('hover'))
  const step = blankStep({ id: 's1', op: 'withPrefix' })
  assert.equal(step.id, 's1')
  assert.equal(step.op, 'withPrefix')
})
