import { defineConfig } from 'vite'
import { message } from './vite-plugins/message.ts'
import { shortlinks } from './vite-plugins/shortlinks.ts'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/calendar-events': 'http://localhost:8788',
    },
  },
  plugins: [message(), shortlinks()],
})
