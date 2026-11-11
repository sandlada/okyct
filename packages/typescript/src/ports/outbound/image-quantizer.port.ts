/**
 * [Hexagonal Layer: Outbound Port]
 * 图像像素色彩量化与主题种子色显著性提取被驱动端契约 (单口单文件)
 * 约束：仅依赖 domain/models，零 DOM 依赖
 */

import type { OKYCT } from '../../domain/models/index.ts'

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
  extractSeedsFromImageData(imageData: ImagePixelBuffer, maxColors?: number): ExtractedSeedColor[]
}
