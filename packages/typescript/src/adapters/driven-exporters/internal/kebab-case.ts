
import { trimAsciiWhitespace } from '../../../domain/index.ts'

export function kebabCase(str: string): string {
  return trimAsciiWhitespace(
    str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  )
    .split(/[-_ \t\n\r\f]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase())
    .join('-')
}
