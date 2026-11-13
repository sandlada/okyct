export const GamutTargets = ['srgb', 'display-p3'] as const
export type GamutTarget = (typeof GamutTargets)[number]
