# What CI — Landing Page and URL Shortener

https://whatci.org/

A Cloudflare Pages site and URL shortener.

## Usage

Edit [`message.md`](message.md) to change the text shown above the links on the index page. Supports full Markdown.

Edit [`links.jsonc`](links.jsonc) to add or change links:

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

At build time, `dist/_redirects` is generated from all entries with `"redirect": true`. Entries with `"webpage": true` are rendered as link cards in the webpage.