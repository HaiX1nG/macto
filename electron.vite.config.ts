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
      sourcemap: false,
      rollupOptions: {
        external: ['electron', 'fsevents'],
      },
    },
    // Use vite's assetsInclude to treat icons as assets
    assetsInclude: ['**/*.png', '**/*.ico', '**/*.icns'],
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
      sourcemap: false,
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
      outDir: path.resolve(__dirname, 'out/renderer'),
      sourcemap: false,
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/renderer/index.html'),
        },
        output: {
          manualChunks(id) {
            // 首屏大依赖拆成独立 chunk，配合 entryFileNames 缓存提升加载
            if (id.includes('node_modules')) {
              if (/node_modules\/(react|react-dom|react-router(-dom)?|@remix-run\/)/.test(id)) {
                return 'vendor-react'
              }
              if (/node_modules\/(antd|@ant-design\/)/.test(id)) {
                return 'vendor-antd'
              }
              if (/node_modules\/framer-motion/.test(id)) {
                return 'vendor-motion'
              }
              if (/node_modules\/axios/.test(id)) {
                return 'vendor-http'
              }
              // 其余第三方
              return 'vendor'
            }
            return undefined
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
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
