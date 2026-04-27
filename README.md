# What CI — Landing Page and URL Shortener

https://whatci.org/

A Cloudflare Pages site and URL shortener.

## Calendar Integration

Calendar events are imported from Google Calendar and cached in Cloudflare KV.

To manually force a cache refresh, visit:

```
https://whatci.org/admin/refresh?token=YOUR_ADMIN_TOKEN
```

The cache is also refreshed automatically when stale (older than 1 hour) after the next calendar request.

## Usage

Edit [`message.md`](message.md) to change the text shown above the links on the index page. Supports full Markdown.

Edit [`links.json`](links.json) to add or change links:

```jsonc
{
    "slug": {
        "label": "Human-readable name",
        "url": "https://destination-url",
        "note": "Additional note to display on home page (optional)",
        "redirect": true,  // include in Cloudflare _redirects
        "webpage": true    // show on the index page
    }
}
```
## Development

Run both Vite and Wrangler in separate terminals to develop locally. Vite give you hot module replacement. Wrangler fetches and hosts calendar events:

```sh
npm run dev          # Vite dev server
npm run dev:wrangler  # Wrangler Pages and Functions
```

> Use URL with the port from `dev:wrangler` to see JSON-LD structured data injected via the Worker.


## Build

At build time, `dist/_redirects` is generated from all entries with `"redirect": true`. Entries with `"webpage": true` are rendered as link cards in the webpage.