import { CompositionLegacySlugs, CompositionStudioSlug } from '../composition/routes.ts'
import { DeltaStudioSlug } from '../delta/routes.ts'
import { ExportStudioSlug } from '../export/routes.ts'
import { OledLegacySlugs, OledStudioSlug } from '../oled/routes.ts'
import { PageStudioSlug } from '../page/routes.ts'
import { PalettesStudioSlug } from '../palettes/routes.ts'
import { SimpleStudioSlug } from '../simple/routes.ts'
import { TokensLegacySlugs, TokensStudioSlug } from '../tokens/routes.ts'

export const StudioViewIds = {
  Tokens: TokensStudioSlug,
  Palettes: PalettesStudioSlug,
  Oled: OledStudioSlug,
  Composition: CompositionStudioSlug,
  Delta: DeltaStudioSlug,
  Simple: SimpleStudioSlug,
  Export: ExportStudioSlug,
  Page: PageStudioSlug,
} as const

export type StudioView = (typeof StudioViewIds)[keyof typeof StudioViewIds]

export const StudioViews = [
  StudioViewIds.Tokens,
  StudioViewIds.Palettes,
  StudioViewIds.Oled,
  StudioViewIds.Composition,
  StudioViewIds.Delta,
  StudioViewIds.Simple,
  StudioViewIds.Page,
  StudioViewIds.Export,
] as const satisfies readonly StudioView[]

export const DefaultStudioView: StudioView = StudioViewIds.Tokens

function legacyRedirectsFor<const T extends readonly string[]>(
  target: StudioView,
  legacy: T,
): { readonly [K in T[number]]: StudioView } {
  const out = {} as { readonly [K in T[number]]: StudioView }
  for (const id of legacy) {
    (out as Record<string, StudioView>)[id] = target
  }
  return out
}

export const StudioLegacyRedirects = {
  ...legacyRedirectsFor(StudioViewIds.Tokens, TokensLegacySlugs),
  ...legacyRedirectsFor(StudioViewIds.Oled, OledLegacySlugs),
  ...legacyRedirectsFor(StudioViewIds.Composition, CompositionLegacySlugs),
} as const

export type StudioLegacyId = keyof typeof StudioLegacyRedirects

export function isStudioLegacyId(value: string): value is StudioLegacyId {
  return value in StudioLegacyRedirects
}
