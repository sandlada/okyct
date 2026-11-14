import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

test('cli.ts executes fair benchmark and prints protocol header', () => {
  const cliPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'cli.ts')
  const output = execFileSync(process.execPath, ['--experimental-strip-types', cliPath], {
    encoding: 'utf8',
  })
  assert.match(output, /OKYCT Fair Benchmark/)
})
