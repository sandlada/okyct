import test from 'node:test'
import assert from 'node:assert/strict'
import {
  HexagonalArchitectureManifest,
  HexagonalLayerIds,
  verifyHexagonalArchitectureBoundaries,
} from './architecture-guard.ts'

test('HexagonalLayerIds defines the four layers in order', () => {
  assert.deepEqual(HexagonalLayerIds, ['domain', 'ports', 'application', 'adapters'])
})

test('HexagonalArchitectureManifest enforces unidirectional dependencies', () => {
  const domain = HexagonalArchitectureManifest.find((r) => r.layer === 'domain')
  const ports = HexagonalArchitectureManifest.find((r) => r.layer === 'ports')
  const application = HexagonalArchitectureManifest.find((r) => r.layer === 'application')
  const adapters = HexagonalArchitectureManifest.find((r) => r.layer === 'adapters')

  assert.ok(domain && ports && application && adapters)
  assert.deepEqual(domain.allowedDependencies, [])
  assert.deepEqual(ports.allowedDependencies, ['domain'])
  assert.equal(application.forbiddenDependencies.includes('adapters'), true)
  assert.equal(adapters.forbiddenDependencies.length, 0)
})

test('verifyHexagonalArchitectureBoundaries validates manifest cleanly when no modules passed', () => {
  const result = verifyHexagonalArchitectureBoundaries()
  assert.equal(result.passed, true)
  assert.equal(result.layersVerified, 4)
  assert.equal(result.filesScanned, 0)
  assert.equal(result.violations.length, 0)
  assert.match(result.summary, /Verified/)
})

test('verifyHexagonalArchitectureBoundaries verifies valid dependency graphs and counts real files', () => {
  const result = verifyHexagonalArchitectureBoundaries([
    { path: 'domain/models/rgb.model.ts', imports: [] },
    { path: 'domain/services/internal/helper.ts', imports: [] },
    { path: 'domain/services/hex-to-rgb.ts', imports: ['../models/rgb.model.ts', './internal/helper.ts'] },
    { path: 'ports/inbound/palette-generation.port.ts', imports: ['../../domain/models/rgb.model.ts'] },
    { path: 'ports/outbound/token-exporter.port.ts', imports: ['../inbound/palette-generation.port.ts'] },
    { path: 'application/tonal-palette.ts', imports: ['../domain/index.ts', '../ports/inbound/palette-generation.port.ts'] },
    { path: 'adapters/create-theme.ts', imports: ['../application/index.ts', '../ports/outbound/token-exporter.port.ts'] },
  ])
  assert.equal(result.passed, true)
  assert.equal(result.filesScanned, 7)
  assert.equal(result.modelsCount, 1)
  assert.equal(result.inboundPortsCount, 1)
  assert.equal(result.outboundPortsCount, 1)
  assert.equal(result.violations.length, 0)
})

test('verifyHexagonalArchitectureBoundaries catches layer, external, internal, and extension violations', () => {
  const result = verifyHexagonalArchitectureBoundaries([
    { path: 'domain/services/bad-ext.ts', imports: ['node:fs'] },
    { path: 'application/bad-layer.ts', imports: ['../adapters/index.ts'] },
    { path: 'application/bad-internal.ts', imports: ['../domain/services/internal/helper.ts'] },
    { path: 'domain/services/index.ts', imports: ['./internal/helper.ts'] },
    { path: 'ports/inbound/bad-ext.port.ts', imports: ['../../domain/models/rgb.model'] },
  ])

  assert.equal(result.passed, false)
  const rules = new Set(result.violations.map((v) => v.rule))
  assert.ok(rules.has('external-dependency'))
  assert.ok(rules.has('forbidden-layer-dependency'))
  assert.ok(rules.has('cross-module-internal-import'))
  assert.ok(rules.has('internal-barrel-reexport'))
  assert.ok(rules.has('missing-ts-extension'))
})
