import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { serializeCanonicalJson } from './serialize-canonical-json.ts'

describe('serializeCanonicalJson', () => {
  it('emits LF-only 2-space indented JSON and preserves supplementary-plane Unicode characters verbatim', () => {
    const out = serializeCanonicalJson({
      'brandAccent😀': {
        color: '#ee9933',
        note: '品牌輔色😀 𠮷 👨‍👩‍👧‍👦',
        empty: {},
      },
    })
    assert.equal(out.includes('\r'), false)
    assert.ok(out.includes('"brandAccent😀": {'))
    assert.ok(out.includes('"note": "品牌輔色😀 𠮷 👨‍👩‍👧‍👦"'))
    assert.ok(out.includes('"empty": {}'))
    assert.equal(out.includes('\\uD83D'), false)
    assert.equal(out.includes('\\ud83d'), false)
  })

  it('escapes quotes, backslashes, control characters, and lone surrogates per ECMA-262 Well-Formed JSON', () => {
    const out = serializeCanonicalJson({
      escaped: 'quote " slash \\ literal \\uD83D\\uDE00 tab \t newline \n nul \u0000',
      loneHigh: 'x\uD83Dy',
      loneLow: 'x\uDE00y',
    })
    assert.equal(out.includes('\r'), false)
    assert.ok(out.includes('\\"'))
    assert.ok(out.includes('\\\\uD83D\\\\uDE00'))
    assert.ok(out.includes('\\t'))
    assert.ok(out.includes('\\n'))
    assert.ok(out.includes('\\u0000'))
    assert.ok(out.includes('x\\ud83dy'))
    assert.ok(out.includes('x\\ude00y'))
  })
})
