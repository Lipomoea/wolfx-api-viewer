import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  // 防止 Vite 清除 Rust 显示的错误
  clearScreen: false,
  server: {
    // Tauri 工作于固定端口，如果端口不可用则报错
    strictPort: true,
    // 如果设置了 host，Tauri 则会使用
    host: 'localhost',
    port: 5173,
  },
  // 添加有关当前构建目标的额外前缀，使这些 CLI 设置的 Tauri 环境变量可以在客户端代码中访问
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri 在 Windows 上使用 Chromium，在 macOS 和 Linux 上使用 WebKit
    /* target:
      process.env.TAURI_ENV_PLATFORM == 'windows'
        ? 'chrome105'
        : 'safari13', */
    // 在 debug 构建中不使用 minify
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // 在 debug 构建中生成 sourcemap
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')
          if (normalizedId.endsWith('/src/utils/CnSeisIntLoc.js')) return 'geo-cn-seis-int'
          if (normalizedId.endsWith('/src/utils/JmaSeisIntLoc.js')) return 'geo-jma-seis-int'
          if (normalizedId.endsWith('/src/utils/TravelTimes.js')) return 'travel-times'
          if (normalizedId.endsWith('/src/utils/FERegions.js')) return 'fe-regions'
          if (!id.includes('node_modules')) return
          if (id.includes('element-plus') || id.includes('@element-plus')) return 'ui-vendor'
          if (id.includes('leaflet')) return 'map-vendor'
          if (id.includes('@tauri-apps')) return 'tauri-vendor'
          if (
            id.includes('@turf') ||
            id.includes('topojson') ||
            id.includes('geokdbush') ||
            id.includes('kdbush')
          ) return 'geo-vendor'
          if (id.includes('vue') || id.includes('pinia')) return 'vue-vendor'
          return 'vendor'
        },
      },
    },
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router'],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
