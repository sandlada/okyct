/**
 * [Hexagonal Architecture Dependency Guard]
 * Four-layer unidirectional dependency inversion manifest and static dependency-graph verifier.
 *
 * 1. domain (models + services) -> zero outer dependencies
 * 2. ports (inbound + outbound) -> depends only on domain/models
 * 3. application (use-cases)    -> depends only on domain and ports (never adapters)
 * 4. adapters (driving + driven)-> implements ports and calls application / domain
 *
 * Browser-safe: zero Node.js runtime imports. Filesystem scanning lives in scripts/verify-architecture.ts.
 */

export const HexagonalLayerIds = ['domain', 'ports', 'application', 'adapters'] as const
export type HexagonalLayerId = (typeof HexagonalLayerIds)[number]

export interface HexagonalLayerRule {
  layer: HexagonalLayerId
  subDirectories: readonly string[]
  allowedDependencies: readonly HexagonalLayerId[]
  forbiddenDependencies: readonly HexagonalLayerId[]
  responsibility: string
}

export const HexagonalArchitectureManifest: readonly HexagonalLayerRule[] = [
  {
    layer: 'domain',
    subDirectories: ['domain/models', 'domain/services'],
    allowedDependencies: [],
    forbiddenDependencies: ['ports', 'application', 'adapters'],
    responsibility:
      'Pure colorimetric math kernel: single-file atomic value models and stateless conversion, gamut, and contrast solvers.',
  },
  {
    layer: 'ports',
    subDirectories: ['ports/inbound', 'ports/outbound'],
    allowedDependencies: ['domain'],
    forbiddenDependencies: ['application', 'adapters'],
    responsibility:
      'Contract boundary layer: inbound driving ports and outbound driven ports (one contract per file).',
  },
  {
    layer: 'application',
    subDirectories: ['application'],
    allowedDependencies: ['domain', 'ports'],
    forbiddenDependencies: ['adapters'],
    responsibility:
      'Use-case orchestration: TonalPalette, on-demand MD3 CSS token schemes, and floating-point layer stacking via ports.',
  },
  {
    layer: 'adapters',
    subDirectories: [
      'adapters/driven-emissive-oled',
      'adapters/driven-exporters',
      'adapters/driven-image-quantizer',
      'adapters/driving-fp',
    ],
    allowedDependencies: ['domain', 'ports', 'application'],
    forbiddenDependencies: [],
    responsibility:
      'Driven and driving adapters: OLED/MicroOLED display physics, token exporters, image quantizer, and FP combinators.',
  },
] as const

export interface SourceModuleSpec {
  readonly path: string
  readonly imports: readonly string[]
}

export const ArchitectureViolationRules = [
  'forbidden-layer-dependency',
  'external-dependency',
  'cross-module-internal-import',
  'internal-barrel-reexport',
  'missing-ts-extension',
  'root-dependency-from-layer',
] as const
export type ArchitectureViolationRule = (typeof ArchitectureViolationRules)[number]

export interface ArchitectureViolation {
  readonly file: string
  readonly specifier: string
  readonly rule: ArchitectureViolationRule
  readonly message: string
}

export interface ArchitectureAuditResult {
  passed: boolean
  layersVerified: number
  filesScanned: number
  modelsCount: number
  inboundPortsCount: number
  outboundPortsCount: number
  violations: readonly ArchitectureViolation[]
  summary: string
}

function normalizePosixPath(raw: string): string {
  const cleaned = raw.replace(/\\/g, '/')
  const parts = cleaned.split('/')
  const stack: string[] = []
  for (const part of parts) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (stack.length > 0 && stack[stack.length - 1] !== '..') {
        stack.pop()
      } else {
        stack.push('..')
      }
    } else {
      stack.push(part)
    }
  }
  return stack.join('/')
}

function resolveRelativePosixPath(fromFile: string, specifier: string): string {
  const normalizedFrom = normalizePosixPath(fromFile)
  const slashIdx = normalizedFrom.lastIndexOf('/')
  const dir = slashIdx === -1 ? '' : normalizedFrom.slice(0, slashIdx)
  return normalizePosixPath(dir ? `${dir}/${specifier}` : specifier)
}

function classifyLayer(posixPath: string): HexagonalLayerId | 'root' {
  const firstSegment = posixPath.split('/')[0]
  if (
    firstSegment === 'domain' ||
    firstSegment === 'ports' ||
    firstSegment === 'application' ||
    firstSegment === 'adapters'
  ) {
    return firstSegment
  }
  return 'root'
}

export function verifyHexagonalArchitectureBoundaries(
  modules?: readonly SourceModuleSpec[]
): ArchitectureAuditResult {
  const domainRule = HexagonalArchitectureManifest.find((r) => r.layer === 'domain')
  const portsRule = HexagonalArchitectureManifest.find((r) => r.layer === 'ports')
  const appRule = HexagonalArchitectureManifest.find((r) => r.layer === 'application')
  const adaptersRule = HexagonalArchitectureManifest.find((r) => r.layer === 'adapters')

  const manifestValid = Boolean(
    domainRule &&
      portsRule &&
      appRule &&
      adaptersRule &&
      domainRule.allowedDependencies.length === 0 &&
      portsRule.allowedDependencies.length === 1 &&
      portsRule.allowedDependencies[0] === 'domain' &&
      !appRule.allowedDependencies.includes('adapters')
  )

  if (modules === undefined) {
    return {
      passed: manifestValid,
      layersVerified: HexagonalArchitectureManifest.length,
      filesScanned: 0,
      modelsCount: 0,
      inboundPortsCount: 0,
      outboundPortsCount: 0,
      violations: [],
      summary: manifestValid
        ? 'Hexagonal 4-Layer Manifest Verified (pass scanned SourceModuleSpec[] for full import graph audit)'
        : 'Hexagonal Architecture Manifest Violation Detected',
    }
  }

  const rulesByLayer = new Map<HexagonalLayerId, HexagonalLayerRule>(
    HexagonalArchitectureManifest.map((rule) => [rule.layer, rule])
  )

  const violations: ArchitectureViolation[] = []
  let modelsCount = 0
  let inboundPortsCount = 0
  let outboundPortsCount = 0

  for (const mod of modules) {
    const file = normalizePosixPath(mod.path)
    if (/^domain\/models\/[^/]+\.model\.ts$/.test(file)) modelsCount++
    if (/^ports\/inbound\/[^/]+\.port\.ts$/.test(file)) inboundPortsCount++
    if (/^ports\/outbound\/[^/]+\.port\.ts$/.test(file)) outboundPortsCount++

    const fromLayer = classifyLayer(file)
    const isBarrel = file === 'index.ts' || file.endsWith('/index.ts')

    for (const specifier of mod.imports) {
      if (!specifier.startsWith('.')) {
        violations.push({
          file,
          specifier,
          rule: 'external-dependency',
          message: `Core module "${file}" must not import external package "${specifier}" (zero-dependency invariant).`,
        })
        continue
      }

      if (!specifier.endsWith('.ts')) {
        violations.push({
          file,
          specifier,
          rule: 'missing-ts-extension',
          message: `Relative import "${specifier}" in "${file}" must include explicit ".ts" extension.`,
        })
      }

      const target = resolveRelativePosixPath(file, specifier)
      const toLayer = classifyLayer(target)

      if (fromLayer !== 'root') {
        if (toLayer === 'root') {
          violations.push({
            file,
            specifier,
            rule: 'root-dependency-from-layer',
            message: `Layer "${fromLayer}" module "${file}" must not import root entry "${target}".`,
          })
        } else if (toLayer !== fromLayer) {
          const layerRule = rulesByLayer.get(fromLayer)!
          if (layerRule.forbiddenDependencies.includes(toLayer)) {
            violations.push({
              file,
              specifier,
              rule: 'forbidden-layer-dependency',
              message: `Layer "${fromLayer}" (${file}) is forbidden from importing layer "${toLayer}" (${target}).`,
            })
          }
        }
      }

      const internalMarker = '/internal/'
      const internalIdx = target.indexOf(internalMarker)
      if (internalIdx !== -1 || target.startsWith('internal/')) {
        const ownerDir = internalIdx === -1 ? '' : target.slice(0, internalIdx)
        const expectedPrefix = ownerDir ? `${ownerDir}/` : ''

        if (isBarrel) {
          violations.push({
            file,
            specifier,
            rule: 'internal-barrel-reexport',
            message: `Barrel "${file}" must not import or re-export module-internal file "${target}".`,
          })
        } else if (!file.startsWith(expectedPrefix)) {
          violations.push({
            file,
            specifier,
            rule: 'cross-module-internal-import',
            message: `Module "${file}" must not import internal file "${target}" belonging to "${ownerDir || 'root'}".`,
          })
        } else {
          const remainder = file.slice(expectedPrefix.length)
          const isSameModuleOrInternal =
            !remainder.includes('/') || remainder.startsWith('internal/')
          if (!isSameModuleOrInternal) {
            violations.push({
              file,
              specifier,
              rule: 'cross-module-internal-import',
              message: `Nested submodule "${file}" must not reach into parent internal file "${target}".`,
            })
          }
        }
      }
    }
  }

  const passed = manifestValid && violations.length === 0
  return {
    passed,
    layersVerified: HexagonalArchitectureManifest.length,
    filesScanned: modules.length,
    modelsCount,
    inboundPortsCount,
    outboundPortsCount,
    violations,
    summary: passed
      ? `Hexagonal 4-Layer Dependency Inversion Verified across ${modules.length} source files (${modelsCount} models, ${inboundPortsCount} inbound ports, ${outboundPortsCount} outbound ports)`
      : `Hexagonal Architecture Boundary Violation Detected (${violations.length} violation${violations.length === 1 ? '' : 's'})`,
  }
}
