import { onRequestGet as getTurnstileConfig } from "../functions/api/turnstile-config.js";
import {
  onRequestGet as rejectRevealEmailGet,
  onRequestPost as revealEmail
} from "../functions/api/reveal-email.js";

const API_PREFIX = "/api/";
const SECURITY_HEADERS = {
  "content-security-policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; upgrade-insecure-requests",
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY"
};

const withSecurityHeaders = (response) => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...SECURITY_HEADERS,
    ...extraHeaders
  }
});

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/turnstile-config") {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed." }, 405, { allow: "GET" });
      }

      return withSecurityHeaders(await getTurnstileConfig({ request, env }));
    }

    if (pathname === "/api/reveal-email") {
      if (request.method === "POST") {
        return withSecurityHeaders(await revealEmail({ request, env }));
      }

      if (request.method === "GET") {
        return withSecurityHeaders(await rejectRevealEmailGet({ request, env }));
      }

      return json({ error: "Method not allowed." }, 405, { allow: "POST" });
    }

    if (pathname.startsWith(API_PREFIX)) {
      return json({ error: "Not found." }, 404);
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  }
};
