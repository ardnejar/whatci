import links from '../links.json'
import './link-item.js'

interface LinkEntry {
  label: string
  url: string
  description?: string
  redirect?: boolean
  webpage?: boolean
}

const container = document.getElementById('links')!
for (const [slug, entry] of Object.entries(links as Record<string, LinkEntry>)) {
  if (!entry.webpage) continue
  const el = document.createElement('link-item')
  el.setAttribute('slug', slug)
  el.setAttribute('label', entry.label)
  el.setAttribute('url', entry.url)
  el.setAttribute('description', entry.description ?? '')
  container.appendChild(el)
}
