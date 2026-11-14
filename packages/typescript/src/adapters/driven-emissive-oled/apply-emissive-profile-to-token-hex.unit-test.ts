import test from 'node:test'
import assert from 'node:assert/strict'
import { applyEmissiveProfileToTokenHex } from './apply-emissive-profile-to-token-hex.ts'

test('applyEmissiveProfileToTokenHex transforms tokens per panel profile and rejects invalid profiles', () => {
  const xrText = applyEmissiveProfileToTokenHex('onSurface', '#FFFFFF', {
    profile: 'micro-oled-xr',
  })
  assert.match(xrText, /^#[0-9a-f]{6}$/i)
  assert.notEqual(xrText, '#FFFFFF')

  assert.throws(
    () => applyEmissiveProfileToTokenHex('surface', '#000000', { profile: 'invalid' as never }),
    /Invalid emissive profile/
  )
})
