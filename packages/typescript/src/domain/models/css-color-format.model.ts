/**
 * [Hexagonal Layer: Domain Model]
 * Supported CSS Color 4 serialization formats for OKYCT palette and scheme outputs.
 */

export const CssColorFormats = ['hex', 'oklch', 'display-p3'] as const
export type CssColorFormat = (typeof CssColorFormats)[number]
