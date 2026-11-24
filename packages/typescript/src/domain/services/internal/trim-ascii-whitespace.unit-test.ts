import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isAsciiWhitespaceCode, trimAsciiWhitespace } from './trim-ascii-whitespace.ts'

describe('trimAsciiWhitespace', () => {
  it('trims W3C ASCII whitespace (space, tab, LF, CR, FF) and preserves inner characters', () => {
    assert.equal(trimAsciiWhitespace(''), '')
    assert.equal(trimAsciiWhitespace(' \t\n\r\f '), '')
    assert.equal(trimAsciiWhitespace(' \t\n\r\f#2563EB\f\r\n\t '), '#2563EB')
    assert.equal(trimAsciiWhitespace('#fff'), '#fff')
  })

  it('does not strip non-ASCII whitespace such as U+0085, U+00A0, U+FEFF, or U+3000', () => {
    assert.equal(isAsciiWhitespaceCode(0x85), false)
    assert.equal(isAsciiWhitespaceCode(0xa0), false)
    assert.equal(isAsciiWhitespaceCode(0xfeff), false)
    assert.equal(isAsciiWhitespaceCode(0x3000), false)
    assert.equal(trimAsciiWhitespace('\u0085#fff'), '\u0085#fff')
    assert.equal(trimAsciiWhitespace('\uFEFF#fff'), '\uFEFF#fff')
    assert.equal(trimAsciiWhitespace('\u00A0#fff\u00A0'), '\u00A0#fff\u00A0')
    assert.equal(trimAsciiWhitespace('\u3000#fff'), '\u3000#fff')
  })
})
