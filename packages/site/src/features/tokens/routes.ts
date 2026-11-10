/** URL slug for the tokens matrix view under `/studio/:view`. */
export const TokensStudioSlug = 'tokens' as const

/** Old slugs that should redirect into {@link TokensStudioSlug}. */
export const TokensLegacySlugs = ['sandbox', 'benchmark', 'colorimetric'] as const
