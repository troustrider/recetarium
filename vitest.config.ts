/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'web',
          environment: 'jsdom',
          globals: true,
          // src/auth.ts lanza al cargarse si falta esta variable, asi que
          // cualquier test que importe la capa de api de verdad se cae sin
          // ella. En CI no hay .env; el valor es de mentira a proposito.
          env: { VITE_NEON_AUTH_URL: 'https://auth.invalido.test/neondb/auth' },
          // Los tests del catalogo montan cientos de recetas y saltan por el
          // indice cargando tandas: con los 5 s por defecto se caian en CI, que
          // corre mas lento que una maquina de desarrollo.
          testTimeout: 15000,
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
