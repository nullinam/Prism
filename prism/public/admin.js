const form = document.querySelector("#auth-form");
const statusLine = document.querySelector("#status");
const report = document.querySelector("#report");
const tokenInput = document.querySelector("#token");
tokenInput.value = sessionStorage.getItem("prism-admin-token") || "";

function escapeText(value) {
  const node = document.createElement("span");
  node.textContent = String(value ?? "");
  return node.innerHTML;
}
function cards(target, values) {
  document.querySelector(target).innerHTML = Object.entries(values || {}).sort((a, b) => b[1] - a[1]).map(([label, count]) => `<article><strong>${escapeText(count)}</strong><span>${escapeText(label)}</span></article>`).join("") || "<span>No records yet</span>";
}
function rows(target, values, fields) {
  document.querySelector(target).innerHTML = values.map(item => `<tr>${fields.map(field => `<td>${escapeText(field === "comment" ? (item[field] || "—") : item[field])}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${fields.length}">No records yet</td></tr>`;
}
async function loadReport(token) {
  statusLine.textContent = "Loading report…";
  const response = await fetch("/api/admin", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Could not load the report.");
  const prefixed = (label, values) => Object.fromEntries(Object.entries(values || {}).map(([key, count]) => [`${label}: ${key}`, count]));
  cards("#activity-summary", { ...prefixed("Platform", body.activity.byPlatform), ...prefixed("Action", body.activity.byAction), ...prefixed("Tool", body.activity.byTool) });
  cards("#feedback-summary", { ...prefixed("Platform", body.feedback.byPlatform), ...prefixed("Rating", body.feedback.byRating), ...prefixed("Tool", body.feedback.byTool) });
  rows("#activity-rows", body.activity.recent, ["occurredAt", "platform", "toolName", "action", "appVersion"]);
  rows("#feedback-rows", body.feedback.recent, ["submittedAt", "platform", "toolName", "rating", "comment"]);
  document.querySelector("#updated").textContent = `Updated ${new Date(body.generatedAt).toLocaleString()} · ${body.activity.retained} activity records retained · ${body.feedback.retained} feedback records retained`;
  report.hidden = false;
  statusLine.textContent = "Report loaded. Records contain no file names, paths, or contents.";
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const token = tokenInput.value.trim();
  try {
    await loadReport(token);
    sessionStorage.setItem("prism-admin-token", token);
  } catch (error) {
    report.hidden = true;
    statusLine.textContent = error instanceof Error ? error.message : "Could not load the report.";
  }
});
document.querySelector("#forget").addEventListener("click", () => {
  sessionStorage.removeItem("prism-admin-token");
  tokenInput.value = "";
  report.hidden = true;
  statusLine.textContent = "Admin token cleared from this tab.";
});
if (tokenInput.value) loadReport(tokenInput.value).catch(error => {
  sessionStorage.removeItem("prism-admin-token");
  tokenInput.value = "";
  statusLine.textContent = error instanceof Error ? error.message : "Enter your admin token to view reports.";
});
