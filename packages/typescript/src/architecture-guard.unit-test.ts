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

test('verifyHexagonalArchitectureBoundaries passes and reports counts', () => {
  const result = verifyHexagonalArchitectureBoundaries()
  assert.equal(result.passed, true)
  assert.equal(result.layersVerified, 4)
  assert.equal(result.inboundPortsCount, 3)
  assert.equal(result.outboundPortsCount, 3)
  assert.match(result.summary, /Verified/)
})
