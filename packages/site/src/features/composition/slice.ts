import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { DefaultPipelineSteps, stepsForPreset } from './pipeline.ts'
import {
  type BlendSpace,
  type CodeTab,
  type OperatorKind,
  type PipelinePreset,
  type PipelineStep,
  type StackLayer,
} from './types.ts'

export interface CompositionState {
  baseColor: string | null
  blendSpace: BlendSpace
  layers: StackLayer[]
  steps: PipelineStep[]
  stepSeq: number
  newOpType: OperatorKind
  inspectStepIdx: number | null
  codeTab: CodeTab
  copied: boolean
}

const InitialLayers: StackLayer[] = [
  { color: '#FFFFFF', opacity: 0.08, defaultOpacity: 0.08, role: 'hover', label: 'Hover state glow layer' },
  { color: '#FFFFFF', opacity: 0.12, defaultOpacity: 0.12, role: 'focus', label: 'Focus state highlight layer' },
  { color: '#000000', opacity: 0.1, defaultOpacity: 0.1, role: 'pressed', label: 'Pressed state darkening layer' },
]

const InitialCompositionState: CompositionState = {
  baseColor: null,
  blendSpace: 'linear-srgb',
  layers: InitialLayers,
  steps: DefaultPipelineSteps,
  stepSeq: DefaultPipelineSteps.length,
  newOpType: 'mapWithAlpha',
  inspectStepIdx: null,
  codeTab: 'output',
  copied: false,
}

function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): void {
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= items.length) {
    return
  }
  const [item] = items.splice(index, 1)
  items.splice(target, 0, item)
}

const compositionSlice = createSlice({
  name: 'composition',
  initialState: InitialCompositionState,
  reducers: {
    followSchemeColors(state) {
      state.baseColor = null
    },
    setFpBaseColor(state, action: PayloadAction<string>) {
      state.baseColor = action.payload
    },
    setFpBlendSpace(state, action: PayloadAction<BlendSpace>) {
      state.blendSpace = action.payload
    },
    pushFpLayer(state, action: PayloadAction<{ color: string; label: string }>) {
      state.layers.push({
        color: action.payload.color,
        opacity: 0.15,
        defaultOpacity: 0.15,
        role: 'custom',
        label: action.payload.label,
      })
    },
    updateFpLayer(state, action: PayloadAction<{ index: number; patch: Partial<StackLayer> }>) {
      const layer = state.layers[action.payload.index]
      if (layer === undefined) {
        return
      }
      Object.assign(layer, action.payload.patch)
    },
    removeFpLayer(state, action: PayloadAction<number>) {
      state.layers.splice(action.payload, 1)
    },
    moveFpLayer(state, action: PayloadAction<{ index: number; direction: 'up' | 'down' }>) {
      moveItem(state.layers, action.payload.index, action.payload.direction)
    },
    setFpNewOp(state, action: PayloadAction<OperatorKind>) {
      state.newOpType = action.payload
    },
    pushFpStep(state) {
      state.stepSeq += 1
      const op = state.newOpType
      state.steps.push({
        id: `step-${state.stepSeq}`,
        op,
        enabled: true,
        keysArg: op === 'validateContract' ? 'primary, onPrimary, surface, outline' : 'primary, onPrimary, surface',
        caseArg: 'kebab',
        prefixArg: '--okyct-token',
        alphaArg: 0.24,
        selectorArg: ':root',
        separatorArg: '-',
      })
    },
    updateFpStep(state, action: PayloadAction<{ index: number; patch: Partial<PipelineStep> }>) {
      const step = state.steps[action.payload.index]
      if (step === undefined) {
        return
      }
      Object.assign(step, action.payload.patch)
    },
    removeFpStep(state, action: PayloadAction<number>) {
      state.steps.splice(action.payload, 1)
      if (state.inspectStepIdx === action.payload) {
        state.inspectStepIdx = null
      } else if (state.inspectStepIdx !== null && state.inspectStepIdx > action.payload) {
        state.inspectStepIdx -= 1
      }
    },
    moveFpStep(state, action: PayloadAction<{ index: number; direction: 'up' | 'down' }>) {
      moveItem(state.steps, action.payload.index, action.payload.direction)
    },
    loadFpPreset(state, action: PayloadAction<PipelinePreset>) {
      state.steps = stepsForPreset(action.payload)
      state.inspectStepIdx = null
    },
    setFpInspectStep(state, action: PayloadAction<number | null>) {
      state.inspectStepIdx = action.payload
    },
    setFpCodeTab(state, action: PayloadAction<CodeTab>) {
      state.codeTab = action.payload
    },
    setFpCopied(state, action: PayloadAction<boolean>) {
      state.copied = action.payload
    },
  },
})

export const {
  followSchemeColors,
  setFpBaseColor,
  setFpBlendSpace,
  pushFpLayer,
  updateFpLayer,
  removeFpLayer,
  moveFpLayer,
  setFpNewOp,
  pushFpStep,
  updateFpStep,
  removeFpStep,
  moveFpStep,
  loadFpPreset,
  setFpInspectStep,
  setFpCodeTab,
  setFpCopied,
} = compositionSlice.actions

export const compositionReducer = compositionSlice.reducer
