# What CI — Page and URL Shortener

A Cloudflare Pages site and URL shortener that displays a list of events from the What CI Google Calendar.

Production: https://whatci.org/

Staging: https://preview.whatci.pages.dev

The preview site uses a separate KV namespace (`CALENDAR_KV_preview`) so it never affects production data. It does not have Google Calendar webhook secrets configured, so its KV cache is **not** kept up to date automatically. To populate or refresh the preview cache, visit `https://preview.whatci.pages.dev/admin/refresh` manually.

## Calendar Integration

Cloudflare web workers
- `calendar-events.ts`
- `calendar-webhook.ts`

Calendar events are cached in Cloudflare KV and updated in real time via Google Calendar push notifications. Google requires a watch channel to deliver notifications; it expires after ~7 days, and the worker renews it before expiry. As a fallback, the cache refreshes automatically after 1 hour of staleness.

To manually force a cache refresh and re-register the watch channel, visit:

```
https://whatci.org/admin/refresh
```

Access requires a Cloudflare Access one-time PIN sent to your email. You must be on the approved email list.

## Content Snippetes, Pages and Short Links

Edit `*.md` file in [`content/`](content/) for snippets and page content. Files are parsed as Markdown and injected at build time via placeholders derived from the filename — `content/footer.md` → `%FOOTER%`.

### App Pages

Non-root pages (`/links`, `/admin/help`, etc.) are generated from [`app.html`](app.html). To add a page, create `content/my-page.md` and add an entry to `pages` in [`vite.config.ts`](vite.config.ts):

```ts
{ route: 'my-page.html', md: 'my-page', title: 'What CI — My Page' }
```

### Short Links

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
| [/calendar-webhook](/calendar-webhook) | Receives Google Calendar push notifications (POST). Verifies the channel token and immediately refreshes KV on event changes. |
| [/admin/refresh](/admin/refresh) | Force-refreshes the KV cache from Google Calendar and re-registers the push notification watch channel. Protected by Cloudflare Access (OTP). Redirects to homepage on success. |
| [/json-ld](/json-ld) | The schema.org `ItemList` JSON-LD payload that gets injected into the page — events for the next 6 months, merged. Useful for inspection. |
| `/<slug>` | Redirects to the destination URL for any slug with `"redirect": true` in `content/links.json`. |


# Services

Cloudflare Analytics
- [whatci.org](https://dash.cloudflare.com/d3b80d9755e6ad8f0cf75743e0f99383/web-analytics/overview?siteTag~in=29ca36207ba24ff8a61fe68fac4fd303&excludeBots=Yes)
- [whatci.pages.dev](https://dash.cloudflare.com/d3b80d9755e6ad8f0cf75743e0f99383/web-analytics/overview?siteTag~in=ecbd81b39eb2420cabf5892f8d6686dc)
- [Functions](https://dash.cloudflare.com/d3b80d9755e6ad8f0cf75743e0f99383/pages/view/whatci/analytics/production)

Google
- [Search Console](https://search.google.com/search-console?resource_id=sc-domain:whatci.org)
- [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=what-ci)

GitHub
- [Repository](https://github.com/ardnejar/whatci)
