import fs from 'node:fs'
import path from 'node:path'

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  )

const files = walk('dist').filter((file) => file.endsWith('.html'))
const issues = []

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8')
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  for (const match of jsonLd) {
    try {
      JSON.parse(match[1])
    } catch (error) {
      issues.push(`${file}: invalid JSON-LD (${error.message})`)
    }
  }
  const titleCount = (html.match(/<title/g) ?? []).length
  if (titleCount !== 1) {
    issues.push(`${file}: ${titleCount} title tags`)
  }
  if (!/<meta name="description"/.test(html)) {
    issues.push(`${file}: missing description`)
  }
  if (!/<link rel="canonical"/.test(html)) {
    issues.push(`${file}: missing canonical`)
  }
}

const index = fs.readFileSync('dist/index.html', 'utf8')
const zh = fs.readFileSync('dist/zh-hant/index.html', 'utf8')

const chromaForge = walk('dist')
  .filter((file) => /\.(html|js|css)$/.test(file))
  .filter((file) => fs.readFileSync(file, 'utf8').toLowerCase().includes('chromaforge'))

console.log('html files:', files.length)
console.log('issues:', issues.length === 0 ? 'none' : issues)
console.log('en prerendered heading:', index.includes('Color that behaves'))
console.log('zh prerendered heading:', zh.includes('讓色彩像光一樣'))
console.log('en text length:', index.length, 'zh text length:', zh.length)
console.log('ChromaForge references:', chromaForge)
