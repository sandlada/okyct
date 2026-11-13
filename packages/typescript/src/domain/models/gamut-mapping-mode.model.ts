export const GamutMappingModes = ['preserve-tone', 'cusp-compress'] as const
export type GamutMappingMode = (typeof GamutMappingModes)[number]
