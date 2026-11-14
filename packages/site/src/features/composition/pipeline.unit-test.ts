import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildStackPreviews,
  renderPipelineSource,
  runPipeline,
} from './pipeline.ts'
import type { PipelineStep, StackLayer } from './types.ts'

describe('composition/pipeline', () => {
  it('runs pipeline steps, renders source, and builds stack previews', () => {
    const layers: StackLayer[] = [
      { color: '#ffffff', opacity: 0.08, defaultOpacity: 0.08, role: 'hover', label: 'Hover' },
    ]
    const previews = buildStackPreviews(layers, '#1A73E8', 'okyct', '#ffffff')
    assert.ok(Array.isArray(previews))
    assert.ok(previews.length > 0)

    const steps: PipelineStep[] = []
    const result = runPipeline(steps, { primary: '#1A73E8' })
    assert.equal(typeof result.finalFormatted, 'string')

    const code = renderPipelineSource(steps)
    assert.equal(typeof code, 'string')
  })
})
