import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import { PagePreviewStringsByLocale } from './page-preview-strings.ts'
import { selectPagePreviewData, selectPagePreviewSrcDoc } from './selectors.ts'

describe('page/selectors', () => {
  it('derives preview data and srcDoc HTML', () => {
    const store = createAppStore()
    const state = store.getState()
    const data = selectPagePreviewData(state)
    assert.match(data.metricPrimary, /^#[0-9A-F]{6}$/)
    const srcDoc = selectPagePreviewSrcDoc(state, PagePreviewStringsByLocale.en)
    assert.ok(srcDoc.includes('<html'))
  })
})
