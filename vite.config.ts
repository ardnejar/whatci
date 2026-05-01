import { defineConfig } from 'vite'
import { content } from './vite-plugins/content.ts'
import { shortlinks } from './vite-plugins/shortlinks.ts'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        copy: 'copy.html',
      },
    },
  },
  server: {
    proxy: {
      '/calendar-events': 'http://localhost:8788',
    },
  },
  plugins: [content(), shortlinks()],
})
