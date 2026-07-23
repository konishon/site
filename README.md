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

### Protected email contact

The homepage uses Cloudflare Turnstile and a Pages Function to reveal the contact
email only after server-side verification. Configure these values for both
Production and Preview in **Workers & Pages → your project → Settings →
Variables and Secrets**:

- `PUBLIC_TURNSTILE_SITE_KEY`: the public widget sitekey, read from the Worker
  runtime environment
- `TURNSTILE_SECRET_KEY`: the matching Turnstile secret, stored as a secret
- `CONTACT_EMAIL`: the email address returned after successful verification,
  stored as a secret

Redeploy after adding the variables. Do not commit the secret key or contact
email to the repository.

## GitHub Pages

The included workflow builds and deploys the site whenever changes are pushed to `main`. In the repository settings, set Pages → Source to **GitHub Actions**.
