export type PagePreviewStrings = {
  lang: string
  searchPlaceholder: string
  pageTitle: string
  infoAlert: string
  warningHint: string
  metrics: {
    primary: string
    secondary: string
    tertiary: string
  }
  chartTitle: string
  listTitle: string
  listRows: readonly {
    title: string
    status?: 'success' | 'error'
    statusLabel?: string
  }[]
  btnPrimary: string
  btnSecondary: string
  railLabels: readonly string[]
}

export const PagePreviewStringsByLocale = {
  en: {
    lang: 'en',
    searchPlaceholder: 'Search',
    pageTitle: 'Overview',
    infoAlert: 'Theme updates sync with your settled seed.',
    warningHint: 'Export quota at 82%.',
    metrics: { primary: 'Primary', secondary: 'Secondary', tertiary: 'Tertiary' },
    chartTitle: 'This week',
    listTitle: 'Activity',
    listRows: [
      { title: 'Deploy', status: 'success', statusLabel: 'Done' },
      { title: 'Sync', status: 'error', statusLabel: 'Failed' },
      { title: 'Review', status: undefined },
    ],
    btnPrimary: 'Continue',
    btnSecondary: 'Dismiss',
    railLabels: ['Overview', 'Reports', 'Devices', 'Settings'],
  },
  'zh-Hant': {
    lang: 'zh-Hant',
    searchPlaceholder: '搜尋',
    pageTitle: '總覽',
    infoAlert: '主題隨已結算種子同步更新。',
    warningHint: '匯出配額已用 82%。',
    metrics: { primary: 'Primary', secondary: 'Secondary', tertiary: 'Tertiary' },
    chartTitle: '本週',
    listTitle: '動態',
    listRows: [
      { title: '部署', status: 'success', statusLabel: '完成' },
      { title: '同步', status: 'error', statusLabel: '失敗' },
      { title: '審核', status: undefined },
    ],
    btnPrimary: '繼續',
    btnSecondary: '關閉',
    railLabels: ['總覽', '報表', '裝置', '設定'],
  },
} as const satisfies Record<string, PagePreviewStrings>
