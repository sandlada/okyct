import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const TestDir = path.dirname(fileURLToPath(import.meta.url))
const DistDir = path.resolve(TestDir, '../dist')

interface OkyctGlobal {
  createTheme: (seed: string, options?: Record<string, unknown>) => {
    schemes: { light: Record<string, string>; dark: Record<string, string> }
  }
  hexToOkyct: (hex: string) => { h: number; c: number; t: number }
  okyctToHex: (color: { h: number; c: number; t: number }) => string
  exportTheme: (theme: unknown, options: Record<string, unknown>) => string
  runColorimetricInvariantSuite: () => ReadonlyArray<{ name: string; passed: boolean }>
}

function evaluateIifeBundle(bundlePath: string): OkyctGlobal {
  const code = fs.readFileSync(bundlePath, 'utf8')
  const context: Record<string, unknown> = {
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    Error,
    TypeError,
    RangeError,
    RegExp,
    JSON,
  }
  context.globalThis = context
  context.window = context
  context.self = context

  vm.createContext(context)
  vm.runInContext(code, context, { filename: path.basename(bundlePath) })

  const globalApi = context.Okyct as OkyctGlobal | undefined
  assert.ok(globalApi, `Expected global "Okyct" to be defined after evaluating ${path.basename(bundlePath)}`)
  return globalApi
}

for (const filename of ['okyct.iife.js', 'okyct.iife.min.js']) {
  test(`IIFE bundle ${filename} exposes global Okyct and passes core invariants`, (t) => {
    const bundlePath = path.join(DistDir, filename)
    if (!fs.existsSync(bundlePath)) {
      t.skip(`${filename} not found in dist/; run build first`)
      return
    }

    const Okyct = evaluateIifeBundle(bundlePath)

    assert.equal(typeof Okyct.createTheme, 'function')
    assert.equal(typeof Okyct.hexToOkyct, 'function')
    assert.equal(typeof Okyct.okyctToHex, 'function')
    assert.equal(typeof Okyct.exportTheme, 'function')
    assert.equal(typeof Okyct.runColorimetricInvariantSuite, 'function')

    const okyct = Okyct.hexToOkyct('#3B82F6')
    const roundtrip = Okyct.okyctToHex(okyct)
    assert.match(roundtrip, /^#[0-9a-fA-F]{6}$/)

    const theme = Okyct.createTheme('#3B82F6')
    assert.ok(theme.schemes.light.primary)
    assert.ok(theme.schemes.dark.primary)

    const results = Okyct.runColorimetricInvariantSuite()
    assert.ok(results.length > 0)
    for (const item of results) {
      assert.equal(item.passed, true, `Invariant "${item.name}" failed in ${filename}`)
    }
  })
}
