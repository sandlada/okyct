import test from 'node:test'
import assert from 'node:assert/strict'
import { EnglishMessages, type MessageKey } from './en.ts'
import { TraditionalChineseMessages } from './zh-Hant.ts'

test('TraditionalChineseMessages has 100% key parity with EnglishMessages', () => {
  const enKeys = Object.keys(EnglishMessages) as MessageKey[]
  for (const key of enKeys) {
    assert.equal(typeof TraditionalChineseMessages[key], 'string', `Missing key: ${key}`)
    assert.ok(TraditionalChineseMessages[key].length > 0, `Empty key: ${key}`)
  }
})
