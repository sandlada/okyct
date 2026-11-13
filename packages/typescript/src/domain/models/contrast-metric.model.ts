export const ContrastMetrics = ['wcag', 'apca', 'both'] as const
export type ContrastMetric = (typeof ContrastMetrics)[number]
