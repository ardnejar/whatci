import { readFileSync } from 'node:fs';
import stripJsonComments from 'strip-json-comments';
import type { Plugin } from 'vite';

interface LinkEntry {
    label: string;
    url: string;
    redirect?: boolean;
    webpage?: boolean;
}

const parseJsonc = (src: string): Record<string, LinkEntry> =>
    JSON.parse(stripJsonComments(src));

export function shortlinks(): Plugin {
    return {
        name: 'shortlinks',

        generateBundle() {
            const links = parseJsonc(readFileSync('./links.jsonc', 'utf8'));
            const entries = Object.entries(links).filter(([, v]) => v.redirect);
            const lines = entries
                .map(([slug, { url }]) => `/${slug}\t${url}\t301`)
                .join('\n');
            this.emitFile({ type: 'asset', fileName: '_redirects', source: lines + '\n' });
            console.log(`Emitted ${entries.length} redirect(s) → _redirects`);
        },
    };
}
