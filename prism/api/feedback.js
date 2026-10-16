import { createHmac, randomUUID } from "node:crypto";
import { applyApiCors, getStore, isSameOrigin, isSmallJson, json, redisPipeline } from "./lib/redis.js";

const MAX_BODY_BYTES = 8 * 1024;
const MAX_COMMENT_LENGTH = 500;
const FEEDBACK_KEY = "prism:feedback:v1";
const PLATFORMS = new Set(["web", "windows", "macos", "linux", "android", "ios"]);
const SPAM_SIGNALS = [
  /\bseo services?\b/i, /\bguest post(?:ing)?\b/i, /\bbacklinks?\b/i,
  /\bcasino\b/i, /\bforex signals?\b/i, /\bcrypto (?:giveaway|investment signals?)\b/i,
  /\bbuy (?:followers|likes|traffic)\b/i, /\b(?:whatsapp|telegram) me\b/i,
  /\bearn \$?\d+ (?:daily|per day)\b/i,
];

function spamLike(comment) {
  const text = comment.trim();
  if (!text) return false;
  const urls = text.match(/https?:\/\/|www\./gi) ?? [];
  const signals = SPAM_SIGNALS.filter((pattern) => pattern.test(text)).length;
  const repeated = /(.)\1{11,}/i.test(text);
  const lowWordRatio = text.length > 90 && text.replace(/[a-z\s]/gi, "").length / text.length > 0.55;
  return urls.length > 1 || repeated || lowWordRatio || (signals > 0 && (urls.length > 0 || signals > 1));
}

export default async function handler(req, res) {
  applyApiCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Use POST to submit feedback." });
  }
  if (!isSameOrigin(req)) return json(res, 403, { error: "Feedback must be sent from PRISM." });
  const parsed = isSmallJson(req, MAX_BODY_BYTES);
  if (parsed.error) return json(res, parsed.error === "large" ? 413 : 400, { error: "Feedback must be valid JSON under 8 KB." });

  const { toolId, toolName, rating, comment = "", platform = "web", appVersion = "unknown", website = "" } = parsed.body;
  if (website) return json(res, 202, { ok: true });
  if (!Number.isInteger(toolId) || toolId < 1 || toolId > 150 || typeof toolName !== "string" || toolName.trim().length < 1 || toolName.length > 100 || !Number.isInteger(rating) || rating < 1 || rating > 5 || typeof comment !== "string" || comment.length > MAX_COMMENT_LENGTH || !PLATFORMS.has(platform) || typeof appVersion !== "string" || appVersion.length > 32) {
    return json(res, 400, { error: "Choose a rating and check the optional note (500 characters maximum)." });
  }
  if (spamLike(comment)) return json(res, 202, { ok: false, error: "This note looks like promotional spam. Please keep feedback focused on the PRISM tool." });

  const store = getStore();
  if (!store) return json(res, 503, { error: "Feedback storage is not connected yet. Your feedback was not submitted." });
  try {
    const address = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
    const rateKey = `prism:feedback:rate:${createHmac("sha256", store.token).update(address).digest("hex")}`;
    const rate = await redisPipeline(store.url, store.token, [["INCR", rateKey], ["EXPIRE", rateKey, 3600]]);
    const count = Number(rate?.[0]?.result);
    if (!Number.isFinite(count)) throw new Error("Storage response was invalid");
    if (count > 3) return json(res, 429, { error: "Please wait before sending more feedback." });

    const record = {
      id: randomUUID(), toolId, toolName: toolName.trim(), rating,
      comment: comment.trim(), platform, appVersion: appVersion.trim(),
      submittedAt: new Date().toISOString(),
    };
    await redisPipeline(store.url, store.token, [["LPUSH", FEEDBACK_KEY, JSON.stringify(record)], ["LTRIM", FEEDBACK_KEY, 0, 499]]);
    return json(res, 200, { ok: true });
  } catch {
    return json(res, 503, { error: "Feedback could not be saved right now. Please try again later." });
  }
}
