import { defineConfig } from 'vite';
import { jsonc } from './plugins/jsonc.ts';
import { message } from './plugins/message.ts';
import { shortlinks } from './plugins/shortlinks.ts';

export default defineConfig({
    publicDir: false,
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    plugins: [jsonc(), message(), shortlinks()],
});
