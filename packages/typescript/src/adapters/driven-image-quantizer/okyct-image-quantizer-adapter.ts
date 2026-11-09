
import type { IImageQuantizerPort } from '../../ports/outbound/image-quantizer.port.ts'
import { extractSeedsFromImageData } from './extract-seeds-from-image-data.ts'

export class OkyctImageQuantizerAdapter implements IImageQuantizerPort {
  extractSeedsFromImageData = extractSeedsFromImageData
}
