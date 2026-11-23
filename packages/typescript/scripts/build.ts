import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

  const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')) as {
    publishConfig?: {
      exports?: Record<string, { types?: string; import?: string; default?: string }>
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
verifyDistOutput(DistDir, PackageDir)
console.log(`[build] OK: compiled @sandlada/okyct into dist/ (rewrote ${rewritten} declaration files, verified publishConfig exports).`)
