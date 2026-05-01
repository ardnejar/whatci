# What CI — Page and URL Shortener

https://whatci.org/

A Cloudflare Pages site and URL shortener that displays a list of events from the What CI Google Calendar.

## Calendar Integration

Calendar events are imported from Google Calendar and cached in Cloudflare KV.

To manually force a cache refresh, visit:

```
https://whatci.org/admin/refresh?key=ADMIN_KEY
```

The cache is also refreshed automatically when stale (older than 1 hour) after the next calendar request.

## Content and Shortlink Editing

Edit [`content/message.md`](content/message.md) to change the text shown above the links on the index page. Supports full Markdown.

Any `*.md` file added to the [`content/`](content/) folder is automatically injected into `index.html` at build time. The placeholder is derived from the filename — `content/footer.md` maps to `%VITE_FOOTER%`. Add the placeholder to the HTML where you want the content to appear.

Edit [`content/links.json`](content/links.json) to add or change links:

```jsonc
{
    "slug": {
        "label": "Human-readable name",
        "url": "https://destination-url",
        "description": "Additional info to display on home page (optional)",
        "redirect": true,  // include in Cloudflare _redirects
        "webpage": true    // show on the index page
    }
}
```

At build time, `dist/_redirects` is generated from all entries with `"redirect": true`. Entries with `"webpage": true` are rendered as link cards in the webpage.


## Development

Run both Vite and Wrangler in separate terminals to develop locally. Vite gives you hot module replacement. Wrangler fetches and hosts calendar events:

```sh
npm run dev          # Vite dev server
npm run dev:wrangler  # Wrangler Pages and Functions
```

> Use URL with the port from `dev:wrangler` to see JSON-LD structured data injected via the Worker.


## Scripts

Fetch raw events directly from the Google Calendar API and save to `test/output/google-calendar-raw.json`:

```sh
npm run fetch-cal
npm run fetch-cal -- --from 2026-05-01 --to 2026-05-31
```

Fetch processed events from the local Wrangler dev server (requires `dev:wrangler` to be running) and save to `test/output/calendar-events.json`:

```sh
npm run fetch-kv
npm run fetch-kv -- --from 2026-05-01 --to 2026-05-31
```

Use `--remote` to fetch from the production KV instead (no local server needed):

```sh
npm run fetch-kv -- --remote
npm run fetch-kv -- --remote --from 2026-05-01 --to 2026-05-31
```

Both scripts print a summary: event count, download size, request time, and write time.


## Special Endpoints

| Endpoint | Description |
|---|---|
| [/calendar-events](/calendar-events) | Calendar events from KV cache as `CalendarEvent[]` JSON. Triggers a blocking fetch on cold start; background refresh when stale. |
| [/admin/refresh?key=ADMIN_KEY](/admin/refresh?key=ADMIN_KEY) | Force-refreshes the KV cache from Google Calendar. Requires `ADMIN_KEY`. Redirects to homepage on success. |
| [/json-ld](/json-ld) | The schema.org `ItemList` JSON-LD payload that gets injected into the page — events for the next 6 months, merged. Useful for inspection. |
| `/<slug>` | Redirects to the destination URL for any slug with `"redirect": true` in `content/links.json`. |


# Services

https://search.google.com/search-console?resource_id=sc-domain%3Awhatci.org