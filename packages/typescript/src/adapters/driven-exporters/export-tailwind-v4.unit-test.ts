import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { exportTailwindV4 } from './export-tailwind-v4.ts'

test('exportTailwindV4 generates @theme block with color tokens', () => {
  const theme = createTheme('#2563EB')
  const tw = exportTailwindV4(theme.schemes.light, theme.schemes.dark)
  assert.match(tw, /@theme/)
  assert.match(tw, /--color-primary:/)
})
