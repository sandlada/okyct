import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('App.tsx defines default/named App component and imports dev-app views', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'App.tsx'),
    'utf8'
  )
  assert.match(source, /export const App|export default function App|export function App/)
  assert.match(source, /ComplianceView|HueDriftView|TransparencyView/)
})
