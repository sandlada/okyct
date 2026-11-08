import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(import.meta.dirname, './src') },
        { find: '@sandlada/benchmark', replacement: path.resolve(import.meta.dirname, '../benchmark/src/index.ts') },
        { find: '@sandlada/okyct/domain', replacement: path.resolve(import.meta.dirname, '../typescript/src/domain/index.ts') },
        { find: '@sandlada/okyct/ports', replacement: path.resolve(import.meta.dirname, '../typescript/src/ports/index.ts') },
        { find: '@sandlada/okyct/application', replacement: path.resolve(import.meta.dirname, '../typescript/src/application/index.ts') },
        { find: '@sandlada/okyct/adapters', replacement: path.resolve(import.meta.dirname, '../typescript/src/adapters/index.ts') },
        { find: '@sandlada/okyct', replacement: path.resolve(import.meta.dirname, '../typescript/src/index.ts') },
      ],
    },
    server: {
      port: 3001,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  }
})
