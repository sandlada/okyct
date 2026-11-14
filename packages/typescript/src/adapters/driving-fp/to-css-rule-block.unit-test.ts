import test from 'node:test'
import assert from 'node:assert/strict'
import { toCssRuleBlock } from './to-css-rule-block.ts'

test('toCssRuleBlock formats CSS rule block for selector', () => {
  const css = toCssRuleBlock(':root')({ '--primary': '#2563EB' })
  assert.match(css, /^:root \{/)
  assert.match(css, /--primary: #2563EB;/)
})
