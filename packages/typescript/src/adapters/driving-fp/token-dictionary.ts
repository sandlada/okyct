
import type { DynamicSchemeColors } from '../../ports/index.ts'

export type TokenDictionary = Record<string, string>

export type TokenSource = TokenDictionary | DynamicSchemeColors

export const NamingCases = ['kebab', 'camel', 'snake', 'constant'] as const
export type NamingCase = (typeof NamingCases)[number]
