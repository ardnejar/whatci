import { defineConfig } from 'vite'
import { message } from './vite-plugins/message.ts'
import { shortlinks } from './vite-plugins/shortlinks.ts'

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [message(), shortlinks()],
})
