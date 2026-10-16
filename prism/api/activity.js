import { createHmac } from "node:crypto";
import { applyApiCors, getStore, isSameOrigin, isSmallJson, json, redisPipeline } from "./lib/redis.js";

const MAX_BODY_BYTES = 2048;
const ACTIVITY_KEY = "prism:activity:v1";
const ACTIONS = new Set(["opened", "started", "completed", "cancelled", "failed"]);
const PLATFORMS = new Set(["web", "windows", "macos", "linux", "android", "ios"]);

export default async function handler(req, res) {
  applyApiCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Use POST to record tool activity." });
  }
  if (!isSameOrigin(req)) return json(res, 403, { error: "Activity must be sent from a PRISM client." });
  const parsed = isSmallJson(req, MAX_BODY_BYTES);
  if (parsed.error) return json(res, parsed.error === "large" ? 413 : 400, { error: "Activity must be valid JSON under 2 KB." });
  const { toolId, toolName, action, platform, appVersion } = parsed.body;
  if (!Number.isInteger(toolId) || toolId < 1 || toolId > 150 || typeof toolName !== "string" || toolName.trim().length < 1 || toolName.length > 100 || !ACTIONS.has(action) || !PLATFORMS.has(platform) || typeof appVersion !== "string" || appVersion.length > 32) {
    return json(res, 400, { error: "Invalid tool activity details." });
  }
  const store = getStore();
  if (!store) return json(res, 503, { error: "Activity storage is not connected." });
  try {
    const address = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
    const rateKey = `prism:activity:rate:${createHmac("sha256", store.token).update(address).digest("hex")}`;
    const rate = await redisPipeline(store.url, store.token, [["INCR", rateKey], ["EXPIRE", rateKey, 3600]]);
    const count = Number(rate?.[0]?.result);
    if (!Number.isFinite(count)) throw new Error("Storage response was invalid");
    if (count > 600) return json(res, 429, { error: "Activity sharing is rate limited." });
    const record = { toolId, toolName: toolName.trim(), action, platform, appVersion: appVersion.trim(), occurredAt: new Date().toISOString() };
    await redisPipeline(store.url, store.token, [["LPUSH", ACTIVITY_KEY, JSON.stringify(record)], ["LTRIM", ACTIVITY_KEY, 0, 1999]]);
    return json(res, 202, { ok: true });
  } catch {
    return json(res, 503, { error: "Activity could not be recorded." });
  }
}
