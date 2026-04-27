import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

interface LinkEntry {
  label: string
  url: string
  redirect?: boolean
  webpage?: boolean
}

const parseJson = (src: string): Record<string, LinkEntry> => JSON.parse(src)

const loadRedirects = (): Map<string, string> => {
  const links = parseJson(readFileSync('./links.json', 'utf8'))
  return new Map(
    Object.entries(links)
      .filter(([, v]) => v.redirect)
      .map(([slug, { url }]) => [`/${slug}`, url])
  )
}

export function shortlinks(): Plugin {
  return {
    name: 'shortlinks',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const redirects = loadRedirects()
        const target = req.url ? redirects.get(req.url) : undefined
        if (target) {
          res.writeHead(301, { Location: target })
          res.end()
          return
        }
        next()
      })
    },

    generateBundle() {
      const redirects = loadRedirects()
      const lines = [...redirects.entries()].map(([slug, url]) => `${slug}\t${url}\t301`).join('\n')
      this.emitFile({ type: 'asset', fileName: '_redirects', source: lines + '\n' })
      console.log(`Emitted ${redirects.size} redirect(s) → _redirects`)
    },
  }
}
