import { defineConfig } from 'electron-vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      target: 'node20',
      lib: {
        entry: path.resolve(__dirname, 'src/main/index.ts'),
      },
      outDir: 'out/main',
      sourcemap: true,
    },
  },
  preload: {
    build: {
      target: 'node20',
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/preload/index.ts'),
        },
      },
      outDir: 'out/preload',
      sourcemap: true,
    },
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      target: 'chrome120',
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/renderer/index.html'),
        },
      },
      outDir: path.resolve(__dirname, 'out/renderer'),
      sourcemap: true,
    },
    resolve: {
      alias: {
        '@main': path.resolve(__dirname, 'src/main'),
        '@preload': path.resolve(__dirname, 'src/preload'),
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
    },
  },
})
