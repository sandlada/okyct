
import type {
  ISchemeBuildingPort,
  DynamicSchemeColors,
  EmissiveSchemeOptions,
} from '../ports/inbound/scheme-building.port.ts'
import type { IDisplayPhysicsPort } from '../ports/outbound/display-physics.port.ts'
import type { TonalPalette } from './tonal-palette.ts'
import type { PaletteSet } from './palette-set.ts'
import { buildDynamicSchemeWithPhysics } from './build-dynamic-scheme-with-physics.ts'
import { resolveCustomColors } from './resolve-custom-colors.ts'
import { auditSchemeContrast } from './audit-scheme-contrast.ts'

export class SchemeBuildingUseCase implements ISchemeBuildingPort<TonalPalette> {
  private readonly physicsPort?: Pick<
    IDisplayPhysicsPort,
    'getPanelSpec' | 'applyBlueBurnInGuard' | 'applySubpixelEdgeCompensation'
  >

  constructor(
    physicsPort?: Pick<
      IDisplayPhysicsPort,
      'getPanelSpec' | 'applyBlueBurnInGuard' | 'applySubpixelEdgeCompensation'
    >
  ) {
    this.physicsPort = physicsPort
  }

  buildDynamicScheme = (
    palettes: PaletteSet,
    isDark: boolean,
    contrastLevel = 0.0,
    emissiveOptions: EmissiveSchemeOptions = {}
  ): DynamicSchemeColors => {
    return buildDynamicSchemeWithPhysics(
      palettes,
      isDark,
      contrastLevel,
      emissiveOptions,
      this.physicsPort
    )
  }

  resolveCustomColors = resolveCustomColors
  auditSchemeContrast = auditSchemeContrast
}
