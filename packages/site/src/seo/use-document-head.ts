/**
 * 路由级文档头部同步 Hook。每次路由或语言变化时重建元数据。
 */

import { useEffect } from 'react'
import type { AppRoute } from '../router/routes.ts'
import { buildSeo } from './build-seo.ts'
import { applySeoToDocument } from './head-tags.ts'

export function useDocumentHead(route: AppRoute): void {
  useEffect(() => {
    applySeoToDocument(buildSeo(route))
  }, [route])
}
