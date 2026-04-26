import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

interface LinkEntry {
  label: string
  url: string
  redirect?: boolean
  webpage?: boolean
}

const parseJson = (src: string): Record<string, LinkEntry> => JSON.parse(src)

export function shortlinks(): Plugin {
  return {
    name: 'shortlinks',

    generateBundle() {
      const links = parseJson(readFileSync('./links.json', 'utf8'))
      const entries = Object.entries(links).filter(([, v]) => v.redirect)
      const lines = entries.map(([slug, { url }]) => `/${slug}\t${url}\t301`).join('\n')
      this.emitFile({ type: 'asset', fileName: '_redirects', source: lines + '\n' })
      console.log(`Emitted ${entries.length} redirect(s) → _redirects`)
    },
  }
}
