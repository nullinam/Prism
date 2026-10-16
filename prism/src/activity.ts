import { APP_VERSION } from "./version";

export type PrismAction = "opened" | "started" | "completed" | "cancelled" | "failed";
export type PrismPlatform = "web" | "windows" | "macos" | "linux" | "android" | "ios";

export function getPrismPlatform(): PrismPlatform {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua) || (platform === "macintel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/win/.test(platform) || /windows/.test(ua)) return "windows";
  if (/mac/.test(platform) || /macintosh|mac os/.test(ua)) return "macos";
  if (/linux|x11/.test(platform) || /linux/.test(ua)) return "linux";
  return "web";
}

/** Best-effort, opt-in metadata only. Never pass file or tool-input data here. */
export function getPrismApiUrl(path: string): string {
  return "__TAURI_INTERNALS__" in window ? `https://prism-khaki-one.vercel.app${path}` : path;
}

export function sendToolActivity(tool: { id: number; name: string }, action: PrismAction): void {
  try {
    if (localStorage.getItem("prism-usage-analytics") !== "true") return;
    const payload = JSON.stringify({
      toolId: tool.id,
      toolName: tool.name,
      action,
      platform: getPrismPlatform(),
      appVersion: APP_VERSION,
    });
    void fetch(getPrismApiUrl("/api/activity"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Usage reporting is optional and must never block a tool.
  }
}
