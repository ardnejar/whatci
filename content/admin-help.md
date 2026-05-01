# What CI — Admin Help

This page is for people who manage the What CI Google Calendar and website content.

---

## How Calendar Events Appear on the Site

Events are pulled from the **What CI Google Calendar** and cached on the What CI page. **To add or update an event:** edit it directly in Google Calendar.

### What the site shows

Each event displays its `title`, `date`, `time`, `location`, and `description`. The description supports basic formatting — line breaks are preserved. HTML is not supported. Preferably, The description should be one sentance with a URL to more information. It can also just be a URL with no additional text.

It does not pull from the URL field that is accessable in Apple Calendar. It only get's data from `title`, `date`, `time`, `location`, and `description`.

If you put a URL in the location field it will mark it as an online event.

---

## Forcing an Immediate Update

Changes in Google Calendar appear on the site after the cache updates — which happens after the next visit that is more than an hour since the last cache update. To force your change to appear right away, visit:

```
https://whatci.org/admin/refresh?key=ADMIN_KEY
```

Get the `ADMIN_KEY` from a What CI team member. On success, you are redirected to the homepage.

---

## Short Links

The links listed on the [What CI homepage](https://whatci.org) each have a short `whatci.org/…` address you can share. For example, `whatci.org/facebook` forwards to the What CI Facebook page. These are easier to type or remember than the full destination URLs.

To add or change a short link, contact the site maintainer.

---

## Contacts

For help with the website or short links, contact the site maintainer.
