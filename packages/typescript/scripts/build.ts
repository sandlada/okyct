import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const ScriptDir = path.dirname(fileURLToPath(import.meta.url))
const PackageDir = path.resolve(ScriptDir, '..')
const DistDir = path.join(PackageDir, 'dist')

function resolveTscBin(): string {
  const candidates = [
    path.join(PackageDir, 'node_modules', 'typescript', 'bin', 'tsc'),
    path.resolve(PackageDir, '..', '..', 'node_modules', 'typescript', 'bin', 'tsc'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error('Could not locate TypeScript compiler binary (typescript/bin/tsc).')
}

function walkFiles(dir: string, predicate: (name: string) => boolean, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, out)
    } else if (entry.isFile() && predicate(entry.name)) {
      out.push(fullPath)
    }
  }
  return out
}

function rewriteDeclarationTsExtensions(distDir: string): number {
  const dtsFiles = walkFiles(distDir, (name) => name.endsWith('.d.ts'))
  let rewrittenCount = 0

  for (const file of dtsFiles) {
    const original = fs.readFileSync(file, 'utf8')
    const updated = original
      .replace(/(from\s+['"]\.[^'"]+)\.ts(['"])/g, '$1.js$2')
      .replace(/(import\(\s*['"]\.[^'"]+)\.ts(['"]\s*\))/g, '$1.js$2')
    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8')
      rewrittenCount++
    }
  }

  return rewrittenCount
}

async function buildIifeBundles(packageDir: string, distDir: string): Promise<void> {
  const entryPoint = path.join(packageDir, 'src', 'index.ts')
  const commonOptions: esbuild.BuildOptions = {
    entryPoints: [entryPoint],
    bundle: true,
    format: 'iife',
    globalName: 'Okyct',
    platform: 'browser',
    target: ['es2022'],
    sourcemap: true,
    legalComments: 'none',
  }

  await Promise.all([
    esbuild.build({
      ...commonOptions,
      minify: false,
      outfile: path.join(distDir, 'okyct.iife.js'),
    }),
    esbuild.build({
      ...commonOptions,
      minify: true,
      outfile: path.join(distDir, 'okyct.iife.min.js'),
    }),
  ])
}

function verifyDistOutput(distDir: string, packageDir: string): void {
  const emittedFiles = walkFiles(distDir, (name) => name.endsWith('.js') || name.endsWith('.d.ts'))
  const strayPattern = /(?:from\s+|import\(\s*)['"]\.[^'"]+\.ts['"]/g

  for (const file of emittedFiles) {
    const content = fs.readFileSync(file, 'utf8')
    const match = content.match(strayPattern)
    if (match) {
      throw new Error(
        `Stray relative .ts import found in build output "${path.relative(packageDir, file)}": ${match[0]}`
      )
    }
  }

  const requiredIifeArtifacts = [
    'okyct.iife.js',
    'okyct.iife.js.map',
    'okyct.iife.min.js',
    'okyct.iife.min.js.map',
  ]
  for (const relArtifact of requiredIifeArtifacts) {
    const absArtifact = path.join(distDir, relArtifact)
    if (!fs.existsSync(absArtifact) || fs.statSync(absArtifact).size === 0) {
      throw new Error(`Missing or empty IIFE build artifact: dist/${relArtifact}`)
    }
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')) as {
    publishConfig?: {
      unpkg?: string
      jsdelivr?: string
      exports?: Record<string, { types?: string; import?: string; default?: string }>
    }
  }
  for (const cdnField of ['unpkg', 'jsdelivr'] as const) {
    const relTarget = pkg.publishConfig?.[cdnField]
    if (!relTarget || !fs.existsSync(path.resolve(packageDir, relTarget))) {
      throw new Error(`Missing build artifact for publishConfig.${cdnField}: ${relTarget ?? '(unset)'}`)
    }
  }

  const exportsMap = pkg.publishConfig?.exports ?? {}
  for (const [subpath, targets] of Object.entries(exportsMap)) {
    for (const [condition, relTarget] of Object.entries(targets)) {
      if (!relTarget) continue
      const absTarget = path.resolve(packageDir, relTarget)
      if (!fs.existsSync(absTarget)) {
        throw new Error(
          `Missing build artifact for export "${subpath}" (${condition}): ${relTarget}`
        )
      }
    }
  }
}

fs.rmSync(DistDir, { recursive: true, force: true })

const tscBin = resolveTscBin()
execFileSync(process.execPath, [tscBin, '-p', 'tsconfig.build.json'], {
  cwd: PackageDir,
  stdio: 'inherit',
})

const rewritten = rewriteDeclarationTsExtensions(DistDir)
await buildIifeBundles(PackageDir, DistDir)
verifyDistOutput(DistDir, PackageDir)
console.log(
  `[build] OK: compiled @sandlada/okyct ESM + IIFE (Okyct) into dist/ (rewrote ${rewritten} declaration files, verified publishConfig exports & CDN targets).`
)
