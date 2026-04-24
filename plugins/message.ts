import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { marked } from 'marked';
import type { Plugin, ViteDevServer } from 'vite';

function buildMessage(): string {
    const message = marked.parse(readFileSync('./message.md', 'utf8')) as string;
    return `<div class="message">${message.trim()}</div>`;
}

export function message(): Plugin {
    return {
        name: 'message',

        transformIndexHtml: {
            order: 'pre',
            handler(html: string): string {
                return html.replace('%VITE_MESSAGE%', buildMessage());
            },
        },

        configureServer(server: ViteDevServer) {
            const msgPath = resolve('./message.md');
            server.watcher.add(msgPath);
            server.watcher.on('change', (file: string) => {
                if (file === msgPath) {
                    server.ws.send({ type: 'full-reload' });
                }
            });
        },
    };
}
