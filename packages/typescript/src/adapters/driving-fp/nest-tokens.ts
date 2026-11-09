
import type { TokenDictionary } from './token-dictionary.ts'

export const nestTokens = (delimiter = '-') =>
  (dict: TokenDictionary): Record<string, any> => {
    const root: Record<string, any> = {}
    for (const [key, val] of Object.entries(dict)) {
      const cleanKey = key.replace(/^--/, '')
      const parts = cleanKey.split(delimiter)
      let current = root
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (i === parts.length - 1) {
          current[part] = val
        } else {
          current[part] = current[part] || {}
          current = current[part]
        }
      }
    }
    return root
  }
