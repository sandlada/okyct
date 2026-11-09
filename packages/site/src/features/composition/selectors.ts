import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store.ts'
import { selectScheme } from '../studio/selectors.ts'
import { buildStackPreviews, renderPipelineSource, runPipeline, type StackPreviewId } from './pipeline.ts'

export const selectFpScreen = createSelector(
  [(state: RootState) => state.composition, selectScheme],
  (fp, scheme) => {
    const baseColor = fp.baseColor ?? scheme.primary
    const foregroundText = scheme.onPrimary
    const statePreviews = buildStackPreviews(fp.layers, baseColor, fp.blendSpace, foregroundText)
    const previewHex = Object.fromEntries(statePreviews.map((preview) => [preview.id, preview.hex])) as Record<StackPreviewId, string>
    const execution = runPipeline(fp.steps, {
      primary: scheme.primary,
      onPrimary: scheme.onPrimary,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      secondary: scheme.secondary,
      tertiary: scheme.tertiary,
      surface: scheme.surface,
      onSurface: scheme.onSurface,
      error: scheme.error,
      success: scheme.success,
    })
    const inspected = fp.inspectStepIdx === null ? undefined : execution.snapshots[fp.inspectStepIdx]
    return {
      layers: fp.layers,
      steps: fp.steps,
      blendSpace: fp.blendSpace,
      baseColor,
      foregroundText,
      tertiary: scheme.tertiary,
      newOpType: fp.newOpType,
      inspectStepIdx: fp.inspectStepIdx,
      codeTab: fp.codeTab,
      copiedCode: fp.copied,
      statePreviews,
      previewHex,
      displayedOutput: inspected?.outputFormatted ?? execution.finalFormatted,
      generatedTsCode: renderPipelineSource(fp.steps),
    }
  },
)
