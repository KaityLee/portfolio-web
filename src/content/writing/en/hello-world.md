---
title: How this site is built
summary: Only approved notes leave the private Obsidian vault for this public site, and time, language and exposure were separated from day one.
date: 2026-10-28
tags: [meta, astro, i18n]
lang: en
translationKey: hello-world
visibility: public
draft: false
license: CC-BY-4.0
---

This site is the public face of **Personal OS**. Every post originates in a private Obsidian vault; only a reviewed and approved copy is placed in this repository and built into static pages.

## Three things separated from the start

- **Time** — dates are stored as ISO 8601 and formatted only at render time, for the reader's locale and time zone.
- **Language** — Korean is the default (`/`), English lives under `/en/`. Translations share a `translationKey` and are linked with `hreflang`.
- **Exposure** — `visibility` (private / restricted / public) and `draft` are independent axes. Lists show public posts only, restricted posts are reachable by link, and private ones are never built.

```ts
// src/utils/date.ts
new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(date);
```

Future posts cover only what I have done and measured myself.
