/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer 4: Driven Adapter — OKYCT Image Quantizer & Salience Scorer]
 * 实现 IImageQuantizerPort 契约：在 OKYCT 空间执行 360° 极坐标色相分桶、高斯平滑与色度加权评分
 * 纯数学实现，零 DOM 依赖
 */

import { rgbToOkyct, okyctToHex } from '../../domain/index.ts';
import type {
  ExtractedSeedColor,
  ImagePixelBuffer,
  IImageQuantizerPort,
} from '../../ports/outbound/image-quantizer.port.ts';

export type { ExtractedSeedColor, ImagePixelBuffer };

/**
 * 从像素数据缓冲区量化并提取 Top-K 最佳 UI 主题种子色
 */
export function extractSeedsFromImageData(
  imageData: ImagePixelBuffer,
  maxColors = 4
): ExtractedSeedColor[] {
  const { data } = imageData;
  const hueBins = new Float64Array(360);
  const chromaSum = new Float64Array(360);
  const toneSum = new Float64Array(360);

  let validPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue;

    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const okyct = rgbToOkyct({ r, g, b });

    if (okyct.t < 10 || okyct.t > 95 || okyct.c < 0.028) {
      continue;
    }

    const bin = Math.floor(okyct.h) % 360;
    hueBins[bin] += 1;
    chromaSum[bin] += okyct.c;
    toneSum[bin] += okyct.t;
    validPixels++;
  }

  if (validPixels === 0) {
    return [
      {
        hex: '#1A73E8',
        okyct: { h: 256, c: 0.16, t: 48 },
        populationRatio: 1,
        salienceScore: 100,
      },
    ];
  }

  const smoothedPop = new Float64Array(360);
  const scores: Array<{ hue: number; score: number; avgC: number; avgT: number; popRatio: number }> = [];

  for (let h = 0; h < 360; h++) {
    if (hueBins[h] === 0) continue;

    let neighborPop = 0;
    let weightedChroma = 0;
    let weightedTone = 0;

    for (let offset = -7; offset <= 7; offset++) {
      const idx = (h + offset + 360) % 360;
      const weight = 1 - Math.abs(offset) / 9;
      neighborPop += hueBins[idx] * weight;
      weightedChroma += chromaSum[idx] * weight;
      weightedTone += toneSum[idx] * weight;
    }

    smoothedPop[h] = neighborPop;
    const avgC = weightedChroma / neighborPop;
    const avgT = weightedTone / neighborPop;
    const popRatio = neighborPop / validPixels;

    const chromaFactor = Math.pow(Math.min(0.28, avgC) / 0.14, 1.15);
    const tonePenalty = avgT < 20 || avgT > 85 ? 0.65 : 1.0;
    const score = popRatio * 100 * chromaFactor * tonePenalty;

    scores.push({ hue: h, score, avgC, avgT, popRatio });
  }

  scores.sort((a, b) => b.score - a.score);

  const selected: ExtractedSeedColor[] = [];
  for (const candidate of scores) {
    const isTooClose = selected.some((existing) => {
      let diff = Math.abs(existing.okyct.h - candidate.hue) % 360;
      if (diff > 180) diff = 360 - diff;
      return diff < 28;
    });

    if (!isTooClose) {
      const clampedT = Math.max(35, Math.min(72, candidate.avgT));
      const clampedC = Math.max(0.08, Math.min(0.24, candidate.avgC));
      const hex = okyctToHex({ h: candidate.hue, c: clampedC, t: clampedT });

      selected.push({
        hex,
        okyct: { h: candidate.hue, c: clampedC, t: clampedT },
        populationRatio: Math.min(1, candidate.popRatio),
        salienceScore: Math.round(candidate.score * 10) / 10,
      });

      if (selected.length >= maxColors) break;
    }
  }

  return selected;
}

export class OkyctImageQuantizerAdapter implements IImageQuantizerPort {
  extractSeedsFromImageData = extractSeedsFromImageData;
}
