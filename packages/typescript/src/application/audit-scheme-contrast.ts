/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getContrastRatio, getApcaContrast } from '../domain/index.ts'
import type { SystemColorToken, DynamicSchemeColors, ContrastAuditItem } from '../ports/inbound/scheme-building.port.ts'

export function auditSchemeContrast(scheme: DynamicSchemeColors): ContrastAuditItem[] {
  const pairs: ReadonlyArray<{
    name: string
    fg: SystemColorToken
    bg: SystemColorToken
    minRatio: number
    minApca: number
  }> = [
    { name: '主要按钮文本', fg: 'onPrimary', bg: 'primary', minRatio: 4.5, minApca: 60 },
    { name: '主要容器文本', fg: 'onPrimaryContainer', bg: 'primaryContainer', minRatio: 4.5, minApca: 60 },
    { name: '次要按钮文本', fg: 'onSecondary', bg: 'secondary', minRatio: 4.5, minApca: 60 },
    { name: '次要容器文本', fg: 'onSecondaryContainer', bg: 'secondaryContainer', minRatio: 4.5, minApca: 60 },
    { name: '第三强调容器', fg: 'onTertiaryContainer', bg: 'tertiaryContainer', minRatio: 4.5, minApca: 60 },
    { name: '正文文本 / 基础背景', fg: 'onSurface', bg: 'surface', minRatio: 4.5, minApca: 60 },
    { name: '次级正文 / 变体表面', fg: 'onSurfaceVariant', bg: 'surfaceVariant', minRatio: 4.5, minApca: 60 },
    { name: '卡片容器文本', fg: 'onSurface', bg: 'surfaceContainer', minRatio: 4.5, minApca: 60 },
    { name: '错误按钮文本', fg: 'onError', bg: 'error', minRatio: 4.5, minApca: 60 },
    { name: '错误容器文本', fg: 'onErrorContainer', bg: 'errorContainer', minRatio: 4.5, minApca: 60 },
    { name: '警告容器文本', fg: 'onWarningContainer', bg: 'warningContainer', minRatio: 4.5, minApca: 60 },
    { name: '成功容器文本', fg: 'onSuccessContainer', bg: 'successContainer', minRatio: 4.5, minApca: 60 },
    { name: '信息按钮文本', fg: 'onInfo', bg: 'info', minRatio: 4.5, minApca: 60 },
    { name: '信息容器文本', fg: 'onInfoContainer', bg: 'infoContainer', minRatio: 4.5, minApca: 60 },
    { name: '倒置表面文本', fg: 'inverseOnSurface', bg: 'inverseSurface', minRatio: 4.5, minApca: 60 },
    { name: '倒置主色文本', fg: 'inverseOnPrimary', bg: 'inversePrimary', minRatio: 4.5, minApca: 60 },
    { name: '倒置主色容器', fg: 'inverseOnPrimaryContainer', bg: 'inversePrimaryContainer', minRatio: 4.5, minApca: 60 },
  ]

  return pairs.map((p) => {
    const fgTone = scheme.tones[p.fg] ?? 50
    const bgTone = scheme.tones[p.bg] ?? 50
    const wcag = getContrastRatio(fgTone, bgTone)
    const apca = Math.abs(getApcaContrast(fgTone, bgTone))

    return {
      name: p.name,
      fgRole: p.fg,
      bgRole: p.bg,
      fgTone,
      bgTone,
      wcagRatio: parseFloat(wcag.toFixed(2)),
      wcagPassAA: wcag >= 4.5,
      wcagPassAAA: wcag >= 7.0,
      apcaLc: apca,
      apcaPass: apca >= 60,
    }
  })
}
