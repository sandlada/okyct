/**
 * [Hexagonal Layer: Outbound Port]
 * Image pixel color quantization and salient theme seed extraction contract (one port per file).
 * Constraint: depends only on domain/models, zero DOM dependency.
 */

import type { OKYCT } from '../../domain/models/index.ts'

export const ImageQuantizerModes = ['hue-tone-grid', 'hue-histogram'] as const
export type ImageQuantizerMode = (typeof ImageQuantizerModes)[number]

export interface ExtractSeedsOptions {
  maxColors?: number
  mode?: ImageQuantizerMode
  minHueDistance?: number
  minToneDistance?: number
}

export interface ExtractedSeedColor {
  hex: string
  okyct: OKYCT
  populationRatio: number
  salienceScore: number
}

export interface ImagePixelBuffer {
  readonly data: Uint8ClampedArray | readonly number[]
  readonly width?: number
  readonly height?: number
}

export interface IImageQuantizerPort {
  extractSeedsFromImageData(
    imageData: ImagePixelBuffer,
    options?: ExtractSeedsOptions
  ): ExtractedSeedColor[]
}
