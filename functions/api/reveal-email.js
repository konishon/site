const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

export async function onRequestPost({ request, env }) {
  if (!env.TURNSTILE_SECRET_KEY || !env.CONTACT_EMAIL) {
    return json({ error: "Contact protection is not configured." }, 503);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Invalid form submission." }, 400);
  }

  if (String(formData.get("company") || "").trim()) {
    return json({ error: "Verification failed." }, 403);
  }

  const token = String(formData.get("cf-turnstile-response") || "");
  if (!token || token.length > 2048) {
    return json({ error: "Please complete the security check." }, 400);
  }

  const verificationBody = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token
  });
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) verificationBody.set("remoteip", remoteIp);

  let verification;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: verificationBody
    });
    verification = await response.json();
  } catch {
    return json({ error: "The security check is temporarily unavailable." }, 502);
  }

  if (verification.success !== true) {
    return json({ error: "The security check failed. Please try again." }, 403);
  }

  const requestHostname = new URL(request.url).hostname;
  if (verification.hostname && verification.hostname !== requestHostname) {
    return json({ error: "The security check was issued for another website." }, 403);
  }

  return json({ email: env.CONTACT_EMAIL });
}

export function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
