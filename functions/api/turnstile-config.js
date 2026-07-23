const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

export function onRequestGet({ env }) {
  if (!env.PUBLIC_TURNSTILE_SITE_KEY) {
    return json({ error: "Turnstile is not configured." }, 503);
  }

  return json({ siteKey: env.PUBLIC_TURNSTILE_SITE_KEY });
}
