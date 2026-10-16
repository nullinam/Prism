import { timingSafeEqual } from "node:crypto";
import { getStore, isSameOrigin, json, redisPipeline } from "./lib/redis.js";

const FEEDBACK_KEY = "prism:feedback:v1";
const ACTIVITY_KEY = "prism:activity:v1";

function validToken(req) {
  const expected = process.env.PRISM_ADMIN_TOKEN || "";
  const supplied = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Use GET to view PRISM reports." });
  }
  if (!isSameOrigin(req)) return json(res, 403, { error: "Dashboard access must come from PRISM." });
  if (!validToken(req)) return json(res, 401, { error: "Enter a valid PRISM admin token." });
  const store = getStore();
  if (!store) return json(res, 503, { error: "Activity storage is not connected." });
  try {
    const [activityResult, feedbackResult] = await redisPipeline(store.url, store.token, [
      ["LRANGE", ACTIVITY_KEY, 0, 1999],
      ["LRANGE", FEEDBACK_KEY, 0, 499],
    ]);
    const parseRows = (result) => (Array.isArray(result?.result) ? result.result : []).map((row) => JSON.parse(row));
    const activity = parseRows(activityResult);
    const feedback = parseRows(feedbackResult);
    const countBy = (items, key) => Object.fromEntries(items.reduce((counts, item) => counts.set(item[key], (counts.get(item[key]) || 0) + 1), new Map()));
    const ratingCounts = feedback.reduce((counts, item) => counts.set(item.rating, (counts.get(item.rating) || 0) + 1), new Map());
    return json(res, 200, {
      generatedAt: new Date().toISOString(),
      activity: { retained: activity.length, byPlatform: countBy(activity, "platform"), byTool: countBy(activity, "toolName"), byAction: countBy(activity, "action"), recent: activity.slice(0, 100) },
      feedback: { retained: feedback.length, byPlatform: countBy(feedback, "platform"), byTool: countBy(feedback, "toolName"), byRating: Object.fromEntries(ratingCounts), recent: feedback.slice(0, 100) },
    });
  } catch {
    return json(res, 503, { error: "PRISM reports could not be loaded." });
  }
}
