/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Dos proyectos: el frontend en jsdom y el backend en node. Los worktrees de
// agentes viven en .claude/ y traen copias viejas de src/: quedan fuera por los
// include anclados y por el exclude explícito.
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'web',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/tests/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['**/node_modules/**', '.claude/**', 'dist/**'],
        },
      },
      {
        test: {
          name: 'server',
          environment: 'node',
          globals: true,
          setupFiles: ['./server/tests/setup.js'],
          include: ['server/tests/**/*.test.js'],
          exclude: ['**/node_modules/**', '.claude/**', 'dist/**'],
          // Cada fichero toca la fila única de app_estado o crea recetas:
          // en paralelo se pisarían entre ellos.
          fileParallelism: false,
          testTimeout: 20000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/hooks/**', 'src/components/**', 'src/utils/**', 'src/context/**', 'server/src/**'],
      exclude: ['.claude/**', 'server/src/data/**', 'server/src/config/**'],
    },
  },
})
