import type { Plugin } from 'vite';
import stripJsonComments from 'strip-json-comments';

const parseJsonc = (src: string): unknown => JSON.parse(stripJsonComments(src));

export function jsonc(): Plugin {
    return {
        name: 'jsonc',
        transform(src: string, id: string) {
            if (id.endsWith('.jsonc')) {
                return `export default ${JSON.stringify(parseJsonc(src))}`;
            }
        },
    };
}
