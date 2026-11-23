import test from 'node:test'
import assert from 'node:assert/strict'
import { renameCase } from './rename-case.ts'

test('renameCase transforms keys to kebab, camel, snake, and constant case', () => {
  const dict = { onPrimaryContainer: '#DBEAFE' }
  assert.deepEqual(renameCase('kebab')(dict), { 'on-primary-container': '#DBEAFE' })
  assert.deepEqual(renameCase('snake')(dict), { on_primary_container: '#DBEAFE' })
  assert.deepEqual(renameCase('constant')(dict), { ON_PRIMARY_CONTAINER: '#DBEAFE' })
  assert.deepEqual(renameCase('camel')({ 'on-primary-container': '#DBEAFE' }), dict)
})

test('renameCase throws when distinct keys collapse to the same transformed key', () => {
  assert.throws(
    () => renameCase('kebab')({ brandBlue: 'red', 'brand-blue': 'blue' }),
    /Token key collision/
  )
})
