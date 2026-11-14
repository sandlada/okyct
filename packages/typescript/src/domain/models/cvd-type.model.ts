/**
 * [Hexagonal Layer: Domain Model]
 * Color Vision Deficiency (CVD) simulation types.
 */

export const CvdTypes = [
  'none',
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia',
] as const

export type CvdType = (typeof CvdTypes)[number]
