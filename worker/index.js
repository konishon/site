import { onRequestGet as getTurnstileConfig } from "../functions/api/turnstile-config.js";
import {
  onRequestGet as rejectRevealEmailGet,
  onRequestPost as revealEmail
} from "../functions/api/reveal-email.js";

const API_PREFIX = "/api/";

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
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

      return getTurnstileConfig({ request, env });
    }

    if (pathname === "/api/reveal-email") {
      if (request.method === "POST") {
        return revealEmail({ request, env });
      }

      if (request.method === "GET") {
        return rejectRevealEmailGet({ request, env });
      }

      return json({ error: "Method not allowed." }, 405, { allow: "POST" });
    }

    if (pathname.startsWith(API_PREFIX)) {
      return json({ error: "Not found." }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
