import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PagePreviewStringsByLocale } from './page-preview-strings.ts'

describe('page/page-preview-strings', () => {
  it('provides en and zh-Hant preview strings', () => {
    assert.equal(typeof PagePreviewStringsByLocale.en.pageTitle, 'string')
    assert.equal(typeof PagePreviewStringsByLocale['zh-Hant'].pageTitle, 'string')
  })
})
