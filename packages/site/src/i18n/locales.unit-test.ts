import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DefaultLocale,
  HtmlLang,
  LocaleLabels,
  LocaleSlugs,
  SupportedLocales,
  isLocale,
  localeFromSlug,
} from './locales.ts'

test('locales.ts defines SupportedLocales, slugs, and locale lookup helpers', () => {
  assert.deepEqual(SupportedLocales, ['en', 'zh-Hant'])
  assert.equal(DefaultLocale, 'en')
  assert.equal(isLocale('en'), true)
  assert.equal(isLocale('fr'), false)
  assert.equal(localeFromSlug(LocaleSlugs['zh-Hant']), 'zh-Hant')
  assert.ok(HtmlLang.en && LocaleLabels.en)
})
