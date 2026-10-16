export async function redisPipeline(url, token, commands) {
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!response.ok) throw new Error("Storage request failed");
  return response.json();
}

export function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).json(body);
}

export function getStore() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function isSameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!origin || !host) return true; // Native clients may not send Origin.
  const nativeOrigins = new Set(["http://tauri.localhost", "https://tauri.localhost", "tauri://localhost"]);
  if (nativeOrigins.has(origin)) return true;
  try { return new URL(origin).host === String(host).split(",")[0].trim(); }
  catch { return false; }
}

export function applyApiCors(req, res) {
  const origin = req.headers.origin;
  const nativeOrigins = new Set(["http://tauri.localhost", "https://tauri.localhost", "tauri://localhost"]);
  if (origin && nativeOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

export function isSmallJson(req, maxBytes) {
  const rawLength = Number(req.headers["content-length"] || 0);
  let body = req.body;
  if (typeof body === "string") {
    if (Buffer.byteLength(body, "utf8") > maxBytes) return { error: "large", body: null };
    try { body = JSON.parse(body); } catch { return { error: "invalid", body: null }; }
  }
  if (rawLength > maxBytes) return { error: "large", body: null };
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "invalid", body: null };
  try {
    if (Buffer.byteLength(JSON.stringify(body), "utf8") > maxBytes) return { error: "large", body: null };
  } catch { return { error: "invalid", body: null }; }
  return { error: null, body };
}
