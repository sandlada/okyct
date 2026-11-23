import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  verifyHexagonalArchitectureBoundaries,
  type SourceModuleSpec,
} from '../src/architecture-guard.ts'

interface Token {
  readonly kind: 'word' | 'string' | 'punct'
  readonly value: string
}

function tokenizeModuleSyntax(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = source.length
  const templateBraceDepths: number[] = []
  let braceDepth = 0

  const skipTemplateChunk = () => {
    while (i < len) {
      const c = source[i]
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === '`') {
        i++
        return
      }
      if (c === '$' && i + 1 < len && source[i + 1] === '{') {
        i += 2
        braceDepth++
        templateBraceDepths.push(braceDepth)
        return
      }
      i++
    }
  }

  while (i < len) {
    const ch = source[i]
    const next = i + 1 < len ? source[i + 1] : ''

    if (ch <= ' ') {
      i++
      continue
    }

    if (ch === '/' && next === '/') {
      i += 2
      while (i < len && source[i] !== '\n') i++
      continue
    }

    if (ch === '/' && next === '*') {
      i += 2
      while (i + 1 < len && !(source[i] === '*' && source[i + 1] === '/')) i++
      i += 2
      continue
    }

    if (ch === "'" || ch === '"') {
      const quote = ch
      i++
      let value = ''
      while (i < len) {
        const c = source[i]
        if (c === '\\' && i + 1 < len) {
          value += source[i + 1]
          i += 2
          continue
        }
        i++
        if (c === quote) break
        value += c
      }
      tokens.push({ kind: 'string', value })
      continue
    }

    if (ch === '`') {
      i++
      skipTemplateChunk()
      continue
    }

    if (ch === '{') {
      braceDepth++
      tokens.push({ kind: 'punct', value: '{' })
      i++
      continue
    }

    if (ch === '}') {
      if (
        templateBraceDepths.length > 0 &&
        templateBraceDepths[templateBraceDepths.length - 1] === braceDepth
      ) {
        templateBraceDepths.pop()
        braceDepth--
        i++
        skipTemplateChunk()
        continue
      }
      braceDepth = Math.max(0, braceDepth - 1)
      tokens.push({ kind: 'punct', value: '}' })
      i++
      continue
    }

    if (/[A-Za-z_$]/.test(ch)) {
      let start = i
      i++
      while (i < len && /[A-Za-z0-9_$]/.test(source[i])) i++
      tokens.push({ kind: 'word', value: source.slice(start, i) })
      continue
    }

    tokens.push({ kind: 'punct', value: ch })
    i++
  }

  return tokens
}

export function extractModuleImports(source: string): string[] {
  const tokens = tokenizeModuleSyntax(source)
  const specifiers: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]
    const prev = i > 0 ? tokens[i - 1] : undefined
    if (tok.kind !== 'word') continue
    if (prev?.kind === 'punct' && prev.value === '.') continue

    if (tok.value === 'import') {
      const next = tokens[i + 1]
      if (!next) continue
      // Side-effect import: import './foo.ts'
      if (next.kind === 'string') {
        specifiers.push(next.value)
        continue
      }
      // Dynamic import: import('./foo.ts')
      if (next.kind === 'punct' && next.value === '(') {
        const arg = tokens[i + 2]
        if (arg?.kind === 'string') {
          specifiers.push(arg.value)
        }
        continue
      }
      // Static import ... from './foo.ts'
      let j = i + 1
      let brace = 0
      while (j < tokens.length) {
        const cur = tokens[j]
        if (cur.kind === 'punct' && cur.value === '{') brace++
        else if (cur.kind === 'punct' && cur.value === '}') brace = Math.max(0, brace - 1)
        else if (brace === 0 && cur.kind === 'word' && cur.value === 'from') {
          const spec = tokens[j + 1]
          if (spec?.kind === 'string') specifiers.push(spec.value)
          break
        } else if (brace === 0 && cur.kind === 'punct' && cur.value === ';') {
          break
        }
        j++
      }
    } else if (tok.value === 'export') {
      const next = tokens[i + 1]
      if (!next) continue
      // Only `export * ... from '...'` or `export [type] { ... } from '...'` can re-export a module
      let j = i + 1
      if (tokens[j]?.kind === 'word' && tokens[j].value === 'type') j++
      const head = tokens[j]
      if (!head || head.kind !== 'punct' || (head.value !== '*' && head.value !== '{')) {
        continue
      }
      let brace = 0
      while (j < tokens.length) {
        const cur = tokens[j]
        if (cur.kind === 'punct' && cur.value === '{') brace++
        else if (cur.kind === 'punct' && cur.value === '}') {
          brace = Math.max(0, brace - 1)
          if (brace === 0) {
            if (tokens[j + 1]?.kind === 'word' && tokens[j + 1].value === 'from') {
              const spec = tokens[j + 2]
              if (spec?.kind === 'string') specifiers.push(spec.value)
            }
            break
          }
        } else if (brace === 0 && cur.kind === 'word' && cur.value === 'from') {
          const spec = tokens[j + 1]
          if (spec?.kind === 'string') specifiers.push(spec.value)
          break
        } else if (brace === 0 && cur.kind === 'punct' && cur.value === ';') {
          break
        }
        j++
      }
    }
  }

  return [...new Set(specifiers)]
}

function walkTsFiles(dir: string, rootDir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkTsFiles(fullPath, rootDir, out)
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.unit-test.ts') &&
      !entry.name.endsWith('.d.ts')
    ) {
      out.push(path.relative(rootDir, fullPath).replace(/\\/g, '/'))
    }
  }
}

export function scanSourceModules(srcRoot: string): SourceModuleSpec[] {
  const files: string[] = []
  walkTsFiles(srcRoot, srcRoot, files)
  files.sort()

  return files.map((relPath) => {
    const content = fs.readFileSync(path.join(srcRoot, relPath), 'utf8')
    return {
      path: relPath,
      imports: extractModuleImports(content),
    }
  })
}

const currentFile = fileURLToPath(import.meta.url)
const executedFile = process.argv[1] ? path.resolve(process.argv[1]) : ''

if (currentFile === executedFile) {
  const srcRoot = path.resolve(path.dirname(currentFile), '../src')
  const modules = scanSourceModules(srcRoot)
  const result = verifyHexagonalArchitectureBoundaries(modules)

  if (!result.passed) {
    console.error(`[architecture-guard] FAILED: ${result.summary}`)
    for (const violation of result.violations) {
      console.error(`  - [${violation.rule}] ${violation.file} -> "${violation.specifier}": ${violation.message}`)
    }
    process.exit(1)
  }

  console.log(`[architecture-guard] OK: ${result.summary}`)
}
