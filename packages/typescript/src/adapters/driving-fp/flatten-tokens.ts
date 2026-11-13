import type { TokenDictionary } from './token-dictionary.ts'

export const flattenTokens = (delimiter = '-') => {
  if (typeof delimiter !== 'string' || delimiter.length === 0) {
    throw new Error('Invalid delimiter for flattenTokens: expected a non-empty string.')
  }

  return (tree: Record<string, unknown>): TokenDictionary => {
    if (tree === null || typeof tree !== 'object' || Array.isArray(tree)) {
      throw new Error('Invalid token tree for flattenTokens: expected a plain object.')
    }

    const result: TokenDictionary = {}
    const recurse = (obj: Record<string, unknown>, currentPath: string[]) => {
      for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith('$')) continue
        const newPath = [...currentPath, k]
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          const record = v as Record<string, unknown>
          if (Object.hasOwn(record, '$value') && record.$value !== undefined) {
            const leaf = record.$value
            if (typeof leaf !== 'string' && typeof leaf !== 'number' && typeof leaf !== 'boolean') {
              throw new Error(`Invalid $value at "${newPath.join(delimiter)}": expected string, number, or boolean.`)
            }
            result[newPath.join(delimiter)] = String(leaf)
          }
          recurse(record, newPath)
        } else if (v !== undefined) {
          if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') {
            throw new Error(`Invalid token leaf value at "${newPath.join(delimiter)}": expected string, number, or boolean.`)
          }
          result[newPath.join(delimiter)] = String(v)
        }
      }
    }
    recurse(tree, [])
    return result
  }
}
