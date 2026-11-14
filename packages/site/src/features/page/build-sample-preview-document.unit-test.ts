import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildSamplePreviewDocument, type SamplePreviewCopy } from './build-sample-preview-document.ts'
import { PagePreviewStringsByLocale } from './page-preview-strings.ts'

describe('page/build-sample-preview-document', () => {
  it('renders standalone HTML document with injected token CSS', () => {
    const copy: SamplePreviewCopy = {
      ...PagePreviewStringsByLocale.en,
      metricPrimary: '#1A73E8',
      metricSecondary: '#5F6368',
      metricTertiary: '#7C4DFF',
      listValues: ['#1A73E8', '#B3261E', '#7C4DFF'],
      customChips: [{ cssBase: 'brand', label: 'Brand' }],
    }
    const html = buildSamplePreviewDocument(':root { --md-sys-color-primary: #1a73e8; }', 'light', copy)
    assert.ok(html.includes('<!doctype html>') || html.includes('<!DOCTYPE html>'))
    assert.ok(html.includes('--md-sys-color-primary'))
  })
})
