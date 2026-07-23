# Nishon Notes

A static Astro-powered blog for Nishon Tandukar.

## Local development

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
```

Astro writes the deployable website to `dist/`.

## Add a post

The content collection is ready in `src/content/posts/`. New Markdown posts use:

```yaml
---
title: "Post title"
description: "Short summary"
published: 2026-07-23
category: "GeoAI"
readingTime: "5 min read"
featured: false
---
```

The current long-form article remains in `public/reading-the-landscape-with-ai.html` so its code examples and existing design are preserved exactly.

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Node version: `22` or newer

## GitHub Pages

The included workflow builds and deploys the site whenever changes are pushed to `main`. In the repository settings, set Pages → Source to **GitHub Actions**.
