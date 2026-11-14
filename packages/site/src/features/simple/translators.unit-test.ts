import test from 'node:test'
import assert from 'node:assert/strict'
import {
  compareTwoColorsPlainly,
  describeColorInPlainLanguage,
  evaluateReadability,
  normalizeHexInput,
} from './translators.ts'

test('normalizeHexInput supports 3-digit and 6-digit hex strings', () => {
  assert.equal(normalizeHexInput('#3b82f6'), '#3B82F6')
  assert.equal(normalizeHexInput('#abc'), '#AABBCC')
  assert.equal(normalizeHexInput('not-a-color'), null)
})

test('describeColorInPlainLanguage translates hue, vividness, and lightness into readable bands', () => {
  const blue = describeColorInPlainLanguage('#2563EB')
  assert.equal(blue.hueFamily, 'blue')
  assert.equal(blue.temperature, 'cool')
  assert.ok(blue.vividnessPct > 40)

  const gray = describeColorInPlainLanguage('#737373')
  assert.equal(gray.hueFamily, 'neutral')
  assert.equal(gray.temperature, 'neutral')
  assert.equal(gray.vividnessLevel, 'muted')
})

test('evaluateReadability grades contrast and provides a WCAG-safe auto-fix when failing', () => {
  const good = evaluateReadability('#111827', '#FFFFFF')
  assert.equal(good.grade, 'great')
  assert.equal(good.suggestedFgHex, null)

  const bad = evaluateReadability('#FEF08A', '#FFFFFF')
  assert.equal(bad.grade, 'poor')
  assert.ok(bad.suggestedFgHex !== null)
  assert.ok((bad.suggestedContrastRatio ?? 0) >= 4.5)
})

test('compareTwoColorsPlainly classifies identical and contrasting colors', () => {
  const same = compareTwoColorsPlainly('#3B82F6', '#3B82F6')
  assert.equal(same.band, 'identical')
  assert.equal(same.brightnessDiff, 'same')

  const diff = compareTwoColorsPlainly('#1D4ED8', '#FDE047')
  assert.equal(diff.band, 'strong-contrast')
  assert.equal(diff.brightnessDiff, 'b-brighter')
  assert.equal(diff.hueDiff, 'different')
})
