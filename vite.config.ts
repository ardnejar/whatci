import { defineConfig } from 'vite'
import { jsonc } from './vite-plugins/jsonc-json.ts'
import { message } from './vite-plugins/message.ts'
import { shortlinks } from './vite-plugins/shortlinks.ts'

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [jsonc(), message(), shortlinks()],
})
