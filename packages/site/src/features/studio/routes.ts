import { CompositionViewId } from '../composition/routes.ts'
import { ExportViewId } from '../export/routes.ts'
import { OledLegacyIds, OledViewId } from '../oled/routes.ts'
import { TokensLegacyIds, TokensViewId } from '../tokens/routes.ts'

export const StudioViews = [
  TokensViewId,
  OledViewId,
  CompositionViewId,
  ExportViewId,
] as const

export type StudioView = (typeof StudioViews)[number]

export const DefaultStudioView: StudioView = TokensViewId

export const StudioLegacyRedirects = {
  [TokensLegacyIds[0]]: TokensViewId,
  [TokensLegacyIds[1]]: TokensViewId,
  [TokensLegacyIds[2]]: TokensViewId,
  [OledLegacyIds[0]]: OledViewId,
} as const

export type StudioLegacyId = keyof typeof StudioLegacyRedirects

export function isStudioLegacyId(value: string): value is StudioLegacyId {
  return value in StudioLegacyRedirects
}
