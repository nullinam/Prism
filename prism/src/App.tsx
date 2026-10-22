import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";
import "./marketing.css";
import { tools, type Tool } from "./catalog";
import { ToolRunner } from "./ToolRunner";
import { APP_VERSION } from "./version";
import { explainToolMatch, searchTools, sortToolsById } from "./toolSearch";

type ImageInfo = {
  name: string;
  width: number | null;
  height: number | null;
  format: string;
  size_bytes: number;
  error?: string | null;
};

type ImageRow = ImageInfo & { id: string };
type SiteSettings = { highContrast: boolean; usageAnalytics: boolean; theme: "light" | "dark" | "system"; accent: "lime" | "blue" | "coral" | "violet"; font: "manrope" | "inter" | "system"; size: "compact" | "comfortable" | "large"; density: "comfortable" | "compact"; motion: boolean; motionStyle: "fluid" | "soft" | "playful"; surfaceDepth: "subtle" | "translucent" | "flat"; corners: "soft" | "bubbly"; lineSpacing: "comfortable" | "spacious"; cardStyle: "soft" | "flat"; sidebarWidth: "comfortable" | "wide"; focusStyle: "standard" | "bold"; contentWidth: "comfortable" | "wide" };
const defaultSettings: SiteSettings = { highContrast: false, usageAnalytics: false, theme: "light", accent: "lime", font: "manrope", size: "comfortable", density: "comfortable", motion: true, motionStyle: "fluid", surfaceDepth: "subtle", corners: "soft", lineSpacing: "comfortable", cardStyle: "soft", sidebarWidth: "comfortable", focusStyle: "standard", contentWidth: "comfortable" };
function readSiteSettings(): SiteSettings {
  try {
    const saved = JSON.parse(localStorage.getItem("prism-site-settings") ?? "{}") as Partial<SiteSettings>;
    const settings = { ...defaultSettings, ...saved };
    // The old default was playful motion; migrate that default to the new fluid profile once.
    if (!saved.surfaceDepth && saved.motionStyle === "playful") settings.motionStyle = "fluid";
    return settings;
  } catch { return defaultSettings; }
}

const isDesktop = "__TAURI_INTERNALS__" in window;
const WEB_MAX_FILES = 10;
const WEB_MAX_FILE_BYTES = 20 * 1024 * 1024;

function getDroppedFileTools(files: File[]): Tool[] {
  const extensions = files.map(file => file.name.split(".").pop()?.toLowerCase() ?? "");
  const imageExt = ["png", "jpg", "jpeg", "webp", "gif", "bmp"];
  const textExt = ["txt", "csv", "json", "xml", "md", "markdown"];
  const all = (list: string[]) => extensions.every(extension => list.includes(extension));
  const eligible = tools.filter(tool => tool.status === "ready" || tool.status === "limited").filter(tool => {
    if (tool.category === "Images" && (files.length > 10 || files.some(file => file.size > 20 * 1024 * 1024))) return false;
    if (tool.category === "PDF" && tool.id !== 21 && (files.length > 2 || files.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024)) return false;
    if (tool.category === "Documents" && (files.length > 2 || files.reduce((sum, file) => sum + file.size, 0) > 5 * 1024 * 1024)) return false;
    if ([61, 62, 63, 64, 65].includes(tool.id) && (files.length > 1 || files[0]?.size > 5 * 1024 * 1024)) return false;
    if (tool.id === 89 && (files.length > 1 || files[0]?.size > 20 * 1024 * 1024)) return false;
    if (all(imageExt) && tool.category === "Images") return tool.id !== 14 && (tool.id !== 15 || files.length >= 2);
    if (all(["pdf"]) && tool.category === "PDF") return tool.id !== 21;
    if (all(textExt) && tool.category === "Documents") return true;
    if (all(["html", "htm"]) && tool.id === 39) return true;
    if (all(["json"]) && [61, 63].includes(tool.id)) return true;
    if (all(["csv"]) && tool.id === 62) return true;
    if (all(["yaml", "yml"]) && tool.id === 64) return true;
    if (all(["xml"]) && tool.id === 65) return true;
    if (all(["zip"]) && tool.id === 89) return true;
    return false;
  });
  const order = [5, 20, 4, 29, 30, 45, 16, 17, 18, 19];
  return eligible.sort((a, b) => (order.indexOf(a.id) < 0 ? 999 : order.indexOf(a.id)) - (order.indexOf(b.id) < 0 ? 999 : order.indexOf(b.id)) || a.id - b.id);
}

function PrismMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`prism-mark${small ? " prism-mark-small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 114 114">
        <path fill="currentColor" d="M54 32 31 66 54 84zM60 32l23 34-23 18z" />
      </svg>
    </span>
  );
}

function ToolCategoryIcon({ category }: { category: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let shape;
  switch (category) {
    case "Images": shape = <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.5"/><path d="m4 17 5-4 3 2 3-4 5 5"/></>; break;
    case "PDF": shape = <><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/></>; break;
    case "Documents": shape = <><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/></>; break;
    case "Text": shape = <><path d="M5 6h14M5 12h14M5 18h9"/></>; break;
    case "Data": shape = <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M15 10v10"/></>; break;
    case "Files": shape = <><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 10h18"/></>; break;
    case "Calculators": shape = <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/></>; break;
    case "Study": shape = <><path d="M3 5.5c4-1 7-.5 9 1.5v13c-2-2-5-2.5-9-1.5z"/><path d="M21 5.5c-4-1-7-.5-9 1.5v13c2-2 5-2.5 9-1.5z"/></>; break;
    case "Work": shape = <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></>; break;
    default: shape = <><path d="m12 3 1.3 5.2L18 6l-2.2 4.7L21 12l-5.2 1.3L18 18l-4.7-2.2L12 21l-1.3-5.2L6 18l2.2-4.7L3 12l5.2-1.3L6 6l4.7 2.2z"/></>;
  }
  return <svg className="tool-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...common}>{shape}</svg>;
}

function App() {
  const [activeTool, setActiveTool] = useState<string | null>(() => sessionStorage.getItem("prism-active-tool"));
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [screen, setScreen] = useState<"site" | "workspace">(isDesktop || !!sessionStorage.getItem("prism-active-tool") ? "workspace" : "site");
  const [settingsRequested, setSettingsRequested] = useState(false);
  useEffect(() => { if (activeTool) sessionStorage.setItem("prism-active-tool", activeTool); else sessionStorage.removeItem("prism-active-tool"); }, [activeTool]);

  if (screen === "workspace") {
    return <Workspace onHome={() => { setActiveTool(null); sessionStorage.removeItem("prism-active-tool"); setScreen("site"); }} onSettings={() => { setSettingsRequested(true); setScreen("site"); }} onTool={setActiveTool} activeTool={activeTool} droppedFiles={droppedFiles} onDroppedFiles={setDroppedFiles} onDroppedFilesConsumed={() => setDroppedFiles([])} />;
  }

  return <MarketingSite initialSettingsOpen={settingsRequested} onSettingsClosed={() => setSettingsRequested(false)} onDropFiles={(files) => { setDroppedFiles(files); setActiveTool(null); sessionStorage.removeItem("prism-active-tool"); setSettingsRequested(false); setScreen("workspace"); }} onOpen={(tool) => { setActiveTool(tool ?? null); if (tool) sessionStorage.setItem("prism-active-tool", tool); setSettingsRequested(false); setScreen("workspace"); }} />;
}

function MarketingSite({ onOpen, onDropFiles, initialSettingsOpen = false, onSettingsClosed }: { onOpen: (tool?: string) => void; onDropFiles: (files: File[]) => void; initialSettingsOpen?: boolean; onSettingsClosed?: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All tools");
  const [showAll, setShowAll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(initialSettingsOpen);
  const closeSettings = () => { setSettingsOpen(false); onSettingsClosed?.(); };
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [mode, setMode] = useState<"beginner" | "advanced">("beginner");
  const [settings, setSettings] = useState<SiteSettings>(readSiteSettings);
  const [fileDrag, setFileDrag] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => { localStorage.setItem("prism-site-settings", JSON.stringify(settings)); localStorage.setItem("prism-usage-analytics", settings.usageAnalytics ? "true" : "false"); }, [settings]);
  useEffect(() => {
    if (!settingsOpen) return;
    const root = document.documentElement;
    const body = document.body;
    const priorRootOverflow = root.style.overflow;
    const priorBodyOverflow = body.style.overflow;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => document.querySelector<HTMLElement>(".settings-dialog .dialog-close")?.focus());
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeSettings(); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      root.style.overflow = priorRootOverflow;
      body.style.overflow = priorBodyOverflow;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [settingsOpen]);
  const categories = ["All tools", ...Array.from(new Set(tools.map(tool => tool.category)))];
  const filtered = useMemo(() => searchTools(tools.filter(tool => category === "All tools" || tool.category === category), query), [category, query]);
  const visible = showAll || query || category !== "All tools" ? filtered : filtered.slice(0, 12);
  const catalogCount = tools.length;

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
  const searchFromHero = (value: string) => { setQuery(value); setShowAll(true); document.getElementById("tools")?.scrollIntoView({ behavior: settings.motion ? "smooth" : "instant", block: "start" }); };
  return <div className={`site-v2 theme-${settings.theme} accent-${settings.accent} font-${settings.font} size-${settings.size} density-${settings.density} motion-${settings.motionStyle} depth-${settings.surfaceDepth} corners-${settings.corners} ${settings.motion ? "" : "reduce-motion"} ${settings.highContrast ? "high-contrast" : ""} line-${settings.lineSpacing} cards-${settings.cardStyle} sidebar-${settings.sidebarWidth} focus-${settings.focusStyle} content-${settings.contentWidth}`}>
    <header className="site-v2-header"><a className="brand" href="#top"><PrismMark/><span>PRISM</span></a><nav aria-label="Main navigation"><a href="#tools">Tools</a><a href="#pricing">Plans</a><a href="#privacy">Privacy</a><a href="#apps">Apps</a></nav><button className="settings-trigger" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog">⚙ <span>Settings</span></button><a className="v2-header-cta" href="#tools">Explore tools <span>↘</span></a></header>
    <main id="top">
      <section className="v2-hero"><div className="v2-hero-copy"><div className="v2-eyebrow"><span/> PRIVATE BY DESIGN <i/> BROWSER TRIAL</div><h1>Good tools.<br/>Your files.<br/><em>Your device.</em></h1><p>Explore {catalogCount} listed browser tools across images, PDFs, documents, data, study, and everyday tasks. Tool cards show workflow status, supported inputs, and trial limits before you choose a file.</p><form className="v2-hero-search" role="search" onSubmit={event=>{event.preventDefault();searchFromHero(query);}}><span aria-hidden="true">⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="What would you like to do?" aria-label="Describe a task to find a PRISM tool"/><button type="submit" aria-label="Find a tool">Find tools <span>↘</span></button></form>{query.trim()&&<div className="v2-hero-suggestions" role="group" aria-label="Matching tools">{filtered.length?filtered.slice(0,4).map(tool=><button key={tool.id} type="button" onClick={()=>onOpen(tool.name)}><span><strong>{String(tool.id).padStart(3,"0")} · {tool.name}</strong><small>{tool.category} · {tool.status==="limited"?"Limited browser trial":"Browser workflow"}</small></span><span aria-hidden="true">↗</span>{explainToolMatch(tool,query)&&<small className="v2-search-match-note">{explainToolMatch(tool,query)}</small>}</button>):<p>No match yet. Try a shorter task, such as “extract images from PDF”.</p>}</div>}<div className="v2-hero-examples" aria-label="Common searches"><span>Try:</span>{["make a photo smaller","combine PDFs","convert a file","count words"].map(example=><button key={example} type="button" onClick={()=>searchFromHero(example)}>{example}</button>)}</div><div className="v2-hero-actions"><a className="v2-button primary" href="#tools">Browse all {catalogCount} listed tools <span>↘</span></a><a className="v2-button secondary" href="#privacy">How privacy works</a></div><div className="v2-hero-note"><span>▣</span> Local-first file workflows <b>·</b> Trial caps on cards <b>·</b> Web experience today</div></div>
        <div className="v2-hero-art"><div className="v2-orbit orbit-a"/><div className="v2-orbit orbit-b"/><div className="v2-glass-card"><div className="v2-card-top"><PrismMark small/><span>PRISM TOOLBOX</span><i>LOCAL</i></div><div className="v2-card-title">A little less<br/>file busywork.</div><div className="v2-card-tools"><div><ToolCategoryIcon category="Images"/> Images <b>{tools.filter(tool => tool.category === "Images" && (tool.status === "ready" || tool.status === "limited")).length}</b></div><div><ToolCategoryIcon category="PDF"/> PDF <b>{tools.filter(tool => tool.category === "PDF" && (tool.status === "ready" || tool.status === "limited")).length}</b></div><div><ToolCategoryIcon category="Documents"/> Documents <b>{tools.filter(tool => tool.category === "Documents" && (tool.status === "ready" || tool.status === "limited")).length}</b></div><div><ToolCategoryIcon category="Utilities"/> More tools <b>{tools.filter(tool => !["Images", "PDF", "Documents"].includes(tool.category) && (tool.status === "ready" || tool.status === "limited")).length}</b></div></div><div className="v2-card-foot"><span><i/> {catalogCount} tools listed</span><span>Limits on each card</span></div></div><div className="v2-float-badge">Files stay here <span>↗</span></div></div>
      </section>
      <div className="v2-trust"><span><b>01</b> Pick a tool</span><i/><span><b>02</b> Work in your browser</span><i/><span><b>03</b> Save your result</span><i/><span><b>04</b> Your file stays yours</span></div>
      <section className={`v2-quickdrop${fileDrag ? " is-dragging" : ""}`} aria-label="Drop a file to find actions" onDragOver={event => { event.preventDefault(); setFileDrag(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFileDrag(false); }} onDrop={event => { event.preventDefault(); setFileDrag(false); onDropFiles(Array.from(event.dataTransfer.files)); }}><input ref={fileInput} type="file" multiple hidden onChange={event => { if (event.currentTarget.files?.length) onDropFiles(Array.from(event.currentTarget.files)); event.currentTarget.value = ""; }} aria-label="Choose files to find matching actions"/><button className="v2-quickdrop-circle" type="button" onClick={() => fileInput.current?.click()} aria-label="Choose a file"><span>＋</span></button><div><span className="v2-overline">START WITH A FILE</span><h2>{fileDrag ? "Drop it to see your options." : "Drop a file. Choose what to do."}</h2><p>PRISM checks the file extension and shows matching tools. Files stay in your browser.</p></div><button type="button" className="v2-quickdrop-browse" onClick={() => fileInput.current?.click()}>Choose files <span>↗</span></button></section>
      <section className="v2-tools" id="tools"><div className="v2-section-head"><div><span className="v2-overline">THE PRISM TOOLBOX</span><h2>Find your next<br/>small win.</h2></div><p>Each card shows its workflow status, supported inputs, and browser trial cap. QA verification is tracked separately from catalog availability.</p></div>
        <div className="v2-controls"><label className="v2-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e=>{setQuery(e.target.value);setShowAll(false);}} placeholder="Describe a task, e.g. make a photo smaller" aria-label="Search tools or describe a task"/><kbd>{catalogCount}</kbd></label><p className="v2-search-note">Search by name or describe the task. Results update as you type and stay on this device.</p><div className="v2-filters" role="group" aria-label="Filter tools by category">{categories.map(item=><button key={item} className={category===item?"selected":""} onClick={()=>{setCategory(item);setShowAll(false);}}>{item}</button>)}</div><div className="v2-filters v2-availability-filters" aria-label="Catalog information"><span>{catalogCount} tools in catalog</span><span>Limits and workflow status are shown on each card</span></div></div>
        <div className="v2-results"><span>{filtered.length} catalog {filtered.length === 1 ? "tool" : "tools"}</span><span>Tool status is separate from QA verification</span></div>
        <div className="v2-tool-grid">{visible.map(tool=><article className="v2-tool-card" key={tool.id}><div className="v2-tool-card-top"><span className="v2-tool-number">{String(tool.id).padStart(3,"0")}</span><span className={`v2-status ${tool.status}`}>{tool.status === "ready" ? "READY TO TRY" : tool.status === "limited" ? "LIMITED TRIAL" : "IN DEVELOPMENT"}</span></div><div className="v2-tool-icon"><ToolCategoryIcon category={tool.category}/></div><h3>{tool.name}</h3><span className="v2-tool-category">{tool.category}</span>{explainToolMatch(tool,query)&&<p className="tool-search-explanation">{explainToolMatch(tool,query)}</p>}<details className="tool-card-help"><summary>What this tool does</summary><p>{tool.beginner}</p><p><strong>Example:</strong> {tool.example}</p><p><strong>Expected result:</strong> {tool.preview}</p></details><div className="v2-limit"><small>{tool.status === "planned" ? "PLANNED TRIAL CAP" : "BROWSER TRIAL LIMIT"}</small><span>{tool.trialLimit}</span></div><button className="v2-tool-action" onClick={()=>tool.status === "ready" || tool.status === "limited" ? onOpen(tool.name) : (setSelectedTool(tool), setMode("beginner"))}>{tool.status === "limited" ? "Try with limits" : tool.status === "ready" ? "Open tool" : "Explore design"} <span>↗</span></button></article>)}</div>
        {!showAll && !query && category === "All tools" && filtered.length > visible.length && <button className="v2-load-more" onClick={()=>setShowAll(true)}>Show all {filtered.length} catalog tools <span>↓</span></button>}
        {filtered.length===0&&<div className="v2-empty">No tools match that search. Try a different word or category.</div>}
      </section>
      <section className="v2-privacy" id="privacy"><div className="v2-privacy-copy"><span className="v2-overline">A SIMPLE PRIVACY PROMISE</span><h2>Your files stay<br/>on your device.</h2><p>PRISM processes selected files locally in your browser and does not upload their contents to PRISM servers. The website host may receive standard connection data when you visit. Browser preferences and trial counters are stored on this device.</p><div className="v2-privacy-points"><span><i>✓</i> No file-content uploads</span><span><i>✓</i> No third-party analytics or ad trackers</span><span><i>✓</i> Activity sharing is optional and off by default</span><span><i>✓</i> Limits shown before file selection</span></div><a className="privacy-details-link" href="/privacy.html">How PRISM handles files · network activity ↗</a></div><div className="v2-privacy-visual"><div className="v2-privacy-ring ring-1"/><div className="v2-privacy-ring ring-2"/><div className="v2-privacy-center"><PrismMark/><span>ON YOUR<br/>DEVICE</span></div><div className="v2-privacy-dot dot-1"/><div className="v2-privacy-dot dot-2"/></div></section>
      <section className="v2-pricing" id="pricing"><div className="v2-pricing-heading"><span className="v2-overline">CURRENT ACCESS</span><h2>Use PRISM<br/><em>on the web.</em></h2><p>The browser experience is the current product. Check each tool’s supported inputs and trial limits before you start.</p></div><div className="v2-plan-grid"><article className="v2-plan-card"><span className="v2-plan-label">WEB EXPERIENCE</span><h3>Browser tools</h3><p className="v2-plan-summary">Use supported workflows directly on this website.</p><ul><li>150 tools listed in the catalog</li><li>Tool status and browser limits shown on each card</li><li>Supported file processing stays on this device</li></ul></article></div></section>
      <section className="v2-apps" id="apps"><div className="v2-apps-heading"><div><span className="v2-overline">AVAILABLE TODAY</span><h2>PRISM is available<br/>on the web.</h2></div><p>We’re focused on making the browser experience useful and reliable. We’ll share news about other platforms when they’re ready.</p></div></section>
      <section className="v2-workflow-note"><div><span className="v2-overline">BEFORE YOU CHOOSE A FILE</span><h2>Know what the tool supports.</h2></div><p>File tools show supported inputs and browser limits before selection. Review the preview and output details before downloading a copy; your original remains unchanged.</p></section>
    </main><footer className="v2-footer"><a className="brand" href="#top"><PrismMark/><span>PRISM</span></a><span>Private browser tools. Windows app planned.</span><div><a href="#tools">Tools</a><a href="#pricing">Plans</a><a href="#privacy">Privacy</a><a href="#apps">Apps</a><a href="https://github.com/nullinam/Prism/blob/main/prism/docs/roadmap.md" target="_blank" rel="noreferrer">Roadmap</a><a href="https://github.com/nullinam/Prism/blob/main/prism/CHANGELOG.md" target="_blank" rel="noreferrer">Release notes</a><a href="https://github.com/nullinam/Prism">GitHub</a><button onClick={() => setSettingsOpen(true)}>Settings · v{APP_VERSION}</button></div></footer>
    {settingsOpen && <div className="prism-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeSettings();}}><section className="prism-dialog settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title"><button className="dialog-close" onClick={closeSettings} aria-label="Close settings">×</button><span className="v2-overline">PERSONALIZE YOUR SPACE</span><h2 id="settings-title">Settings</h2><p className="dialog-intro">Make PRISM feel right for you. Preferences stay in this browser.</p><div className="settings-version"><span>Web trial</span><strong>Version {APP_VERSION}</strong></div><div className="settings-grid"><label>Appearance<select value={settings.theme} onChange={e=>updateSetting("theme",e.target.value as SiteSettings["theme"])}><option value="light">Light</option><option value="dark">Dark</option><option value="system">Use device setting</option></select></label><label>Accent color<select value={settings.accent} onChange={e=>updateSetting("accent",e.target.value as SiteSettings["accent"])}><option value="lime">Prism lime</option><option value="blue">Sky blue</option><option value="coral">Soft coral</option><option value="violet">Violet</option></select></label><label>Font<select value={settings.font} onChange={e=>updateSetting("font",e.target.value as SiteSettings["font"])}><option value="manrope">Manrope</option><option value="inter">Inter</option><option value="system">System font</option></select></label><label>Text size<select value={settings.size} onChange={e=>updateSetting("size",e.target.value as SiteSettings["size"])}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label><label>Layout density<select value={settings.density} onChange={e=>updateSetting("density",e.target.value as SiteSettings["density"])}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label>Interaction feel<select value={settings.motionStyle} onChange={e=>updateSetting("motionStyle",e.target.value as SiteSettings["motionStyle"])}><option value="fluid">Fluid · Apple-inspired</option><option value="soft">Quiet and soft</option><option value="playful">Playful bounce</option></select></label><label>Surface depth<select value={settings.surfaceDepth} onChange={e=>updateSetting("surfaceDepth",e.target.value as SiteSettings["surfaceDepth"])}><option value="subtle">Subtle depth</option><option value="translucent">Translucent layers</option><option value="flat">Flat surfaces</option></select></label><label>Card corners<select value={settings.corners} onChange={e=>updateSetting("corners",e.target.value as SiteSettings["corners"])}><option value="soft">Soft</option><option value="bubbly">Extra rounded</option></select></label><label>Line spacing<select value={settings.lineSpacing} onChange={e=>updateSetting("lineSpacing",e.target.value as SiteSettings["lineSpacing"])}><option value="comfortable">Comfortable</option><option value="spacious">Extra spacious</option></select></label><label>Card style<select value={settings.cardStyle} onChange={e=>updateSetting("cardStyle",e.target.value as SiteSettings["cardStyle"])}><option value="soft">Soft surfaces</option><option value="flat">Clean and flat</option></select></label><label>Sidebar width<select value={settings.sidebarWidth} onChange={e=>updateSetting("sidebarWidth",e.target.value as SiteSettings["sidebarWidth"])}><option value="comfortable">Comfortable</option><option value="wide">Extra wide</option></select></label><label>Page width<select value={settings.contentWidth} onChange={e=>updateSetting("contentWidth",e.target.value as SiteSettings["contentWidth"])}><option value="comfortable">Comfortable</option><option value="wide">Use more space</option></select></label><label>Keyboard focus<select value={settings.focusStyle} onChange={e=>updateSetting("focusStyle",e.target.value as SiteSettings["focusStyle"])}><option value="standard">Standard outline</option><option value="bold">Bold outline</option></select></label></div><label className="settings-switch"><span><strong>Motion effects</strong><small>Use smooth, responsive movement across the site and toolbox</small></span><input type="checkbox" checked={settings.motion} onChange={e=>updateSetting("motion",e.target.checked)}/></label><label className="settings-switch"><span><strong>High contrast</strong><small>Strengthen text and control outlines</small></span><input type="checkbox" checked={settings.highContrast} onChange={e=>updateSetting("highContrast",e.target.checked)}/></label><label className="settings-switch"><span><strong>Share anonymous tool activity</strong><small>Optional and off by default. Sends platform, app version, tool, and action only. Never sends file data. You can turn it off at any time.</small></span><input type="checkbox" checked={settings.usageAnalytics} onChange={e=>updateSetting("usageAnalytics",e.target.checked)} aria-label="Share anonymous tool activity"/></label><p className="feedback-privacy-link"><a href="/privacy.html" target="_blank" rel="noreferrer">Read exactly what activity and feedback PRISM stores ↗</a></p><div className="dialog-actions"><button className="v2-button primary" onClick={closeSettings}>Done</button><button className="text-button" onClick={()=>setSettings(defaultSettings)}>Reset to defaults</button></div></section></div>}
    {selectedTool && <div className="prism-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedTool(null);}}><section className="prism-dialog tool-design-dialog" role="dialog" aria-modal="true" aria-labelledby="tool-design-title"><button className="dialog-close" onClick={()=>setSelectedTool(null)} aria-label="Close tool design">×</button><span className="v2-overline">{selectedTool.category.toUpperCase()} · TOOL {String(selectedTool.id).padStart(3,"0")}</span><h2 id="tool-design-title">{selectedTool.name}</h2><div className="design-tabs" role="tablist" aria-label="Tool experience level"><button role="tab" aria-selected={mode==="beginner"} className={mode==="beginner"?"selected":""} onClick={()=>setMode("beginner")}>Beginner</button><button role="tab" aria-selected={mode==="advanced"} className={mode==="advanced"?"selected":""} onClick={()=>setMode("advanced")}>Advanced</button></div><div className="design-description"><span>{mode === "beginner" ? "A SIMPLE START" : "MORE CONTROL"}</span><p>{selectedTool[mode]}</p></div><div className="design-example"><span>TRY THIS</span><p>{selectedTool.example}</p><span>PREVIEW BEFORE SAVING</span><p>{selectedTool.preview}</p></div><div className="design-options"><h3>{mode === "beginner" ? "Starter workflow" : "Advanced options"}</h3><ul>{selectedTool[mode].split(/,\s*|;\s*/).filter(Boolean).map((item,index)=><li key={`${item}-${index}`}><i>✓</i>{item.trim().replace(/\.$/,"")}</li>)}</ul></div><div className="design-cap"><span>Browser trial limit</span><strong>{selectedTool.trialLimit}</strong></div><div className="design-foot"><span>{selectedTool.status === "limited" ? "Limited by browser engine" : selectedTool.status === "ready" ? "Available to try" : "Design preview · This tool is not available yet"}</span>{(selectedTool.status === "ready" || selectedTool.status === "limited") && <button className="v2-button primary" onClick={()=>{const name=selectedTool.name;setSelectedTool(null);onOpen(name);}}>{selectedTool.status === "limited" ? "Try with limits ↗" : "Try this tool ↗"}</button>}</div></section></div>}
  </div>;
}
function Workspace({ onHome, onSettings, onTool, activeTool, droppedFiles, onDroppedFiles, onDroppedFilesConsumed }: { onHome: () => void; onSettings: () => void; onTool: (tool: string | null) => void; activeTool: string | null; droppedFiles: File[]; onDroppedFiles: (files: File[]) => void; onDroppedFilesConsumed: () => void }) {
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const [workspaceSettings] = useState<SiteSettings>(readSiteSettings);
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("prism-favorite-tools") ?? "[]") as string[]; } catch { return []; } });
  const toggleFavorite = (name: string) => setFavorites(current => { const next = current.includes(name) ? current.filter(item => item !== name) : [...current, name]; try { localStorage.setItem("prism-favorite-tools", JSON.stringify(next)); } catch { /* Favorites are optional local preferences. */ } return next; });
  const filteredTools = useMemo(() => searchTools(tools, query), [query]);
  const activeCategory = tools.find((tool) => tool.name === activeTool)?.category;
  const openTool = (tool: string) => onTool(tool);
  const categories = Array.from(new Set(tools.map(tool => tool.category)));
  useEffect(() => { const focusSearch = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchInput.current?.focus(); } }; window.addEventListener("keydown", focusSearch); return () => window.removeEventListener("keydown", focusSearch); }, []);
  useEffect(() => {
    if (!activeTool || categories.includes(activeTool) || ["Recent tools", "Browse image tools", "PDF tools", "Document tools", "Everyday tools"].includes(activeTool)) return;
    try { const prior = JSON.parse(localStorage.getItem("prism-recent-tools") ?? "[]") as string[]; localStorage.setItem("prism-recent-tools", JSON.stringify([activeTool, ...prior.filter(name => name !== activeTool)].slice(0, 8))); } catch { /* Recent tools are optional. */ }
  }, [activeTool]);

  const platformShortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
  return <div className={`app-shell theme-${workspaceSettings.theme} accent-${workspaceSettings.accent} font-${workspaceSettings.font} size-${workspaceSettings.size} density-${workspaceSettings.density} motion-${workspaceSettings.motionStyle} depth-${workspaceSettings.surfaceDepth} corners-${workspaceSettings.corners} ${workspaceSettings.motion ? "" : "reduce-motion"} ${workspaceSettings.highContrast ? "high-contrast" : ""} line-${workspaceSettings.lineSpacing} cards-${workspaceSettings.cardStyle} sidebar-${workspaceSettings.sidebarWidth} focus-${workspaceSettings.focusStyle} content-${workspaceSettings.contentWidth}`}>
    <aside className="app-sidebar">
      <a className="brand app-brand" href="#home" onClick={(event) => { event.preventDefault(); onTool(null); }}><PrismMark /><span>PRISM</span></a>
      <div className="sidebar-label">Workspace</div>
      <button className={`sidebar-item ${!activeTool ? "active" : ""}`} onClick={() => onTool(null)}><span>⌂</span> Home</button>
      <button className={`sidebar-item ${activeTool === "Recent tools" ? "active" : ""}`} onClick={() => onTool("Recent tools")}><span>◷</span> Recent tools</button>
      <button className={`sidebar-item ${activeTool === "Favorites" ? "active" : ""}`} onClick={() => onTool("Favorites")}><span>☆</span> Favorites{favorites.length ? ` · ${favorites.length}` : ""}</button>
      <div className="sidebar-label">Toolbox</div>
      {categories.map((item) => <button key={item} className={`sidebar-item ${activeCategory === item || activeTool === item || item === "Images" && activeTool === "Browse image tools" || item === "PDF" && activeTool === "PDF tools" || item === "Documents" && activeTool === "Document tools" ? "active" : ""}`} onClick={() => onTool(item)}><ToolCategoryIcon category={item}/> {item}</button>)}
      <div className="sidebar-bottom"><div className="privacy-badge"><i /> Files stay on this device</div><button onClick={onSettings}>⚙ Settings</button><button onClick={onHome}>About PRISM ↗</button></div>
    </aside>
    <main className="workspace-main">
      <header className="workspace-header"><div className="breadcrumb">PRISM <span>/</span> {activeTool ?? "Workspace"}</div><label className="search"><span aria-hidden="true">⌕</span><input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Describe what you want to do…" aria-label="Search tools or describe a task" /><kbd>{platformShortcut}</kbd></label><div className="local-status"><i /> Local processing</div></header>
      {(activeTool === "Inspect dimensions" || activeTool === "Inspect image dimensions") ? <ImageInspector /> : activeTool && tools.find(tool => tool.name === activeTool) ? <ToolRunner key={activeTool} tool={tools.find(tool => tool.name === activeTool)!} initialFiles={droppedFiles} onInitialFilesConsumed={onDroppedFilesConsumed} onBack={() => onTool("")} /> : activeTool ? <ToolPicker tools={filteredTools} onTool={openTool} activeTool={activeTool} favorites={favorites} onFavorite={toggleFavorite} /> : <HomeWorkspace tools={filteredTools} query={query} onTool={openTool} favorites={favorites} onFavorite={toggleFavorite} droppedFiles={droppedFiles} onDroppedFiles={onDroppedFiles} onDroppedFilesConsumed={onDroppedFilesConsumed} onOpenTool={openTool} />}
    </main>
  </div>;
}

function HomeWorkspace({ tools: visibleTools, query, onTool, favorites, onFavorite, droppedFiles, onDroppedFiles, onDroppedFilesConsumed, onOpenTool }: { tools: Tool[]; query: string; onTool: (tool: string) => void; favorites: string[]; onFavorite: (name: string) => void; droppedFiles: File[]; onDroppedFiles: (files: File[]) => void; onDroppedFilesConsumed: () => void; onOpenTool: (tool: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const actionTools = useMemo(() => getDroppedFileTools(droppedFiles), [droppedFiles]);
  const acceptFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming);
    setFileError("");
    if (!next.length) return;
    if (next.length > WEB_MAX_FILES) { setFileError(`Choose up to ${WEB_MAX_FILES} files per batch.`); return; }
    if (next.some(file => file.size > WEB_MAX_FILE_BYTES)) { setFileError("A file is larger than the 20 MB web trial limit. Choose a smaller file."); return; }
    onDroppedFiles(next);
  };
  const chooseAction = (tool: Tool) => { onOpenTool(tool.name); };
  useEffect(() => {
    if (!droppedFiles.length) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onDroppedFilesConsumed(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [droppedFiles, onDroppedFilesConsumed]);
  return <div className="workspace-content">
    <div className="welcome-row"><div><span className="kicker">YOUR WORKSPACE</span><h1>A little more room<br />to get things done.</h1><p>Choose a tool and keep moving. Your files are processed locally in this workspace.</p></div><div className="welcome-mark"><PrismMark /></div></div>
    <div className={`quick-drop-zone${isDragging ? " is-dragging" : ""}`} onDragOver={event => { event.preventDefault(); setIsDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }} onDrop={event => { event.preventDefault(); setIsDragging(false); acceptFiles(event.dataTransfer.files); }}>
      <input ref={fileInput} type="file" multiple hidden onChange={event => { acceptFiles(event.currentTarget.files ?? []); event.currentTarget.value = ""; }} aria-label="Choose files for a suggested action" />
      <button className="quick-drop-circle" type="button" onClick={() => fileInput.current?.click()} aria-label="Choose a file to see actions"><span aria-hidden="true">＋</span></button>
      <div className="quick-drop-copy"><strong>{isDragging ? "Drop to see what PRISM can do" : "Drop a file. Pick an action. Done."}</strong><span>PRISM checks the file type and shows matching browser tools. Your file stays on this device.</span><button type="button" className="quick-drop-browse" onClick={() => fileInput.current?.click()}>Choose files <span>↗</span></button></div>
      <div className="quick-drop-hint"><span>PDF</span><span>IMAGE</span><span>TEXT</span><span>DATA</span></div>
    </div>
    {fileError && <p className="quick-drop-error" role="alert">{fileError}</p>}
    {droppedFiles.length > 0 && <div className="drop-action-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onDroppedFilesConsumed(); }}><section className="drop-action-dialog" role="dialog" aria-modal="true" aria-labelledby="drop-action-title"><header><div><span className="kicker">FILE DETECTED BY EXTENSION</span><h2 id="drop-action-title">What should PRISM do?</h2><p>Choose an action to open it with your file already selected.</p></div><button className="drop-action-close" type="button" aria-label="Close file actions" onClick={onDroppedFilesConsumed}>×</button></header><div className="drop-detected-files">{droppedFiles.map((file, index) => <div className="drop-detected-file" key={`${file.name}-${index}`}><span className="drop-file-badge">{file.name.split(".").pop()?.slice(0,4).toUpperCase() || "FILE"}</span><strong title={file.name}>{file.name}</strong><small>{formatBytes(file.size)}</small></div>)}</div>{actionTools.length ? <div className="drop-action-grid" aria-label="Available actions">{actionTools.map((tool, index) => <button key={tool.id} className={`drop-action-option${index === 0 ? " recommended" : ""}`} type="button" onClick={() => chooseAction(tool)}><span className="drop-action-icon"><ToolCategoryIcon category={tool.category}/></span><span><strong>{tool.name}</strong><small>{tool.trialLimit} · {tool.status === "limited" ? "Limited trial" : "Ready to try"}</small></span><i aria-hidden="true">↗</i></button>)}</div> : <div className="drop-no-actions"><strong>No matching action is available in this web trial yet.</strong><p>The file has not been uploaded. Browse the toolbox to see supported inputs and formats.</p><button type="button" className="button button-light" onClick={onDroppedFilesConsumed}>Back to toolbox</button></div>}<footer><span>Processed on this device</span><button type="button" onClick={onDroppedFilesConsumed}>Cancel</button></footer></section></div>}
    <div className="tool-section-title"><div><h2>{query ? `Tools for “${query}”` : "Explore tools"}</h2><p>{query ? "Ranked by task wording and relevance. Results update locally as you type." : "Tools are listed by ID, from 001 to 150. Search by name or describe the job you need done."}</p></div><span>{visibleTools.length} matching tools</span></div>
    {visibleTools.length ? <div className="tool-grid">{visibleTools.map((tool, index) => <ToolCard key={tool.id} tool={tool} index={index} onClick={() => onTool(tool.name)} favorite={favorites.includes(tool.name)} onFavorite={() => onFavorite(tool.name)} />)}</div> : <div className="workspace-footnote">No tools match that description. Try simpler wording such as “compress image” or “merge PDFs”.</div>}
    <div className="workspace-footnote"><span>✳</span> Available tools have a local trial workflow. PDF compression, known-password unlocking, AES-256 protection, and JPEG extraction now run locally with clearly stated limits. File tools process selected files in your browser; saved work stays in this browser.</div>
  </div>;
}

function ToolCard({ tool, index, onClick, favorite = false, onFavorite }: { tool: Tool; index: number; onClick: () => void; favorite?: boolean; onFavorite?: () => void }) {
  const unavailable = tool.status === "in-progress" || tool.status === "planned";
  return <article className="tool-card-wrap"><button className="tool-card" onClick={onClick} disabled={unavailable} aria-disabled={unavailable}><span className={`tool-icon tint-${index % 4}`}><ToolCategoryIcon category={tool.category}/></span><strong>{String(tool.id).padStart(3,"0")} · {tool.name}</strong><small>{tool.category} · {tool.status === "limited" ? "Limited browser trial" : tool.status === "ready" ? "Ready to try · QA status tracked separately" : "In development"}</small><span className={`tool-state ${tool.status}`}>{tool.status === "limited" ? "LIMITED" : tool.status === "ready" ? "READY TO TRY" : "IN DEVELOPMENT"}</span></button><details className="tool-card-help"><summary>What this tool does</summary><p>{tool.beginner}</p><p><strong>Example:</strong> {tool.example}</p><p><strong>Expected result:</strong> {tool.preview}</p><p><strong>Trial limit:</strong> {tool.trialLimit}</p></details>{onFavorite && <button className={`tool-favorite ${favorite ? "is-favorite" : ""}`} onClick={onFavorite} aria-label={`${favorite ? "Remove from" : "Add to"} favorites: ${tool.name}`} aria-pressed={favorite}>{favorite ? "★" : "☆"}</button>}</article>;
}

function ToolPicker({ tools: visibleTools, onTool, activeTool, favorites, onFavorite }: { tools: Tool[]; onTool: (tool: string) => void; activeTool: string; favorites: string[]; onFavorite: (name: string) => void }) {
  const categories: Record<string, string[]> = { "Browse image tools": ["Images"], "PDF tools": ["PDF"], "Document tools": ["Documents"], "Everyday tools": ["Text", "Data", "Files", "Calculators", "Study", "Work", "Utilities"] };
  const selected = categories[activeTool] ?? (activeTool === "Recent tools" || activeTool === "Favorites" ? null : [activeTool]);
  const [recentNames, setRecentNames] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("prism-recent-tools") ?? "[]") as string[]; } catch { return []; } });
  const items = activeTool === "Recent tools" ? recentNames.map(name => visibleTools.find(tool => tool.name === name)).filter((tool): tool is Tool => !!tool) : activeTool === "Favorites" ? favorites.map(name => visibleTools.find(tool => tool.name === name)).filter((tool): tool is Tool => !!tool).sort((left,right)=>left.id-right.id) : sortToolsById(selected ? visibleTools.filter(t => selected.includes(t.category)) : visibleTools);
  const title = ["Browse image tools", "PDF tools", "Document tools", "Everyday tools"].includes(activeTool) ? activeTool.replace("Browse ", "") : activeTool;
  return <div className="workspace-content"><div className="tool-page-heading"><span className="kicker">{items.length} CATALOG {items.length === 1 ? "TOOL" : "TOOLS"}</span><h1>{title}</h1><p>{activeTool === "Recent tools" ? "Your last opened tools are saved in this browser by tool name only. PRISM does not keep file names or paths in this list." : activeTool === "Favorites" ? "Favorites are saved in this browser by tool name only. Clear browser site data to remove them all." : "Tools are listed by ID, from 001 to 150. Search by name, example, or describe a task in your own words. Matching stays on this device."}</p>{activeTool === "Recent tools" && recentNames.length > 0 && <button className="button button-light" onClick={() => { localStorage.removeItem("prism-recent-tools"); setRecentNames([]); }}>Clear recent tools</button>}</div>{items.length ? <div className="tool-grid">{items.map((tool, index) => <ToolCard key={tool.id} tool={tool} index={index} onClick={() => onTool(tool.name)} favorite={favorites.includes(tool.name)} onFavorite={() => onFavorite(tool.name)} />)}</div> : <div className="workspace-footnote">{activeTool === "Recent tools" ? "No recently opened tools yet. Recent-tool names stay only in this browser." : activeTool === "Favorites" ? "No favorites yet. Use the star on any tool card to save it here." : "No tools match that description. Try simpler wording such as “compress image” or “merge PDFs”."}</div>}</div>;
}

function ImageInspector() {
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function addFiles(files: FileList | File[]) {
    const chosen = Array.from(files);
    setMessage("");
    if (!isDesktop && chosen.length > WEB_MAX_FILES) {
      setMessage(`The web version accepts up to ${WEB_MAX_FILES} files at a time. Remove some files and try again.`);
      return;
    }
    if (!isDesktop && chosen.some((file) => file.size > WEB_MAX_FILE_BYTES)) {
      setMessage("One or more files exceed the web trial limit of 20 MB per file. Choose smaller files to continue.");
      return;
    }
    setBusy(true);
    try {
      if (isDesktop) {
        const paths = await open({ multiple: true, title: "Inspect image dimensions", filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff"] }] });
        const selected = Array.isArray(paths) ? paths : paths ? [paths] : [];
        if (!selected.length) return;
        const result = await invoke<ImageInfo[]>("inspect_images", { paths: selected });
        setRows((current) => [...current, ...result.map((row) => ({ ...row, id: crypto.randomUUID() }))]);
      } else {
        const inspected: ImageRow[] = [];
        for (const file of chosen) {
          try {
            const { width, height, format } = await readImageHeader(file);
            inspected.push({ id: crypto.randomUUID(), name: file.name, width, height, format, size_bytes: file.size });
          } catch (error) {
            inspected.push({ id: crypto.randomUUID(), name: file.name, width: null, height: null, format: file.type.replace("image/", "").toUpperCase() || "IMAGE", size_bytes: file.size, error: error instanceof Error ? error.message : "Unsupported image format" });
          }
        }
        setRows((current) => [...current, ...inspected]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not inspect those images.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="workspace-content tool-workspace">
    <div className="tool-page-heading"><span className="kicker">IMAGE TOOL · 01</span><h1>Inspect dimensions</h1><p>Check each supported image’s dimensions, format, and file size in your browser. Files stay on this device.</p></div>
    <div className="limits-note"><span>◉</span> Browser preview: up to {WEB_MAX_FILES} files, {WEB_MAX_FILE_BYTES / 1024 / 1024} MB each. No file uploads.</div>
    <button className="file-picker" onClick={() => isDesktop ? void addFiles([]) : input.current?.click()} disabled={busy}>
      <span className="file-picker-icon">{busy ? "◌" : "＋"}</span><strong>{busy ? "Inspecting images…" : "Choose images"}</strong><small>{isDesktop ? "PNG, JPEG, WebP, GIF, BMP, or TIFF" : "PNG, JPEG, WebP, GIF, or BMP · 20 MB per file"}</small>
      {!isDesktop && <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" multiple onChange={(event) => { if (event.currentTarget.files) void addFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />}
    </button>
    {message && <div className="inline-message" role="alert">{message}</div>}
    {rows.length > 0 && <section className="results-panel"><div className="results-head"><div><strong>Image details</strong><span>{rows.length} file{rows.length === 1 ? "" : "s"}</span></div><button onClick={() => setRows([])}>Clear list</button></div><div className="result-list">{rows.map((row) => <div className="result-row" key={row.id}><div className="result-type">▧</div><div className="result-name"><strong>{row.name}</strong><small>{row.format} · {formatBytes(row.size_bytes)}</small></div><div className="result-dimensions">{row.width && row.height ? `${row.width} × ${row.height} px` : row.error ?? "Could not read dimensions"}</div></div>)}</div></section>}
  </div>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readImageHeader(file: File): Promise<{ width: number; height: number; format: string }> {
  // Only inspect a bounded header slice. This avoids decoding large pixel buffers in the browser preview.
  const bytes = new Uint8Array(await file.slice(0, 512 * 1024).arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
  const readUInt24LE = (offset: number) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);

  if (bytes.length >= 24 && ascii(1, 3) === "PNG" && ascii(12, 4) === "IHDR") {
    return { width: view.getUint32(16, false), height: view.getUint32(20, false), format: "PNG" };
  }
  if (bytes.length >= 10 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a")) {
    return { width: view.getUint16(6, true), height: view.getUint16(8, true), format: "GIF" };
  }
  if (bytes.length >= 26 && ascii(0, 2) === "BM") {
    return { width: Math.abs(view.getInt32(18, true)), height: Math.abs(view.getInt32(22, true)), format: "BMP" };
  }
  if (bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP" && ascii(12, 4) === "VP8X") {
    return { width: readUInt24LE(24) + 1, height: readUInt24LE(27) + 1, format: "WEBP" };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      const marker = bytes[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const segmentLength = view.getUint16(offset, false);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      if (frameMarkers.has(marker) && segmentLength >= 7) {
        return { height: view.getUint16(offset + 3, false), width: view.getUint16(offset + 5, false), format: "JPEG" };
      }
      offset += segmentLength;
    }
    throw new Error("Could not find JPEG dimensions in the first 512 KB.");
  }
  throw new Error("This image format is not supported in the web version. Choose a PNG, JPEG, WebP, GIF, or BMP image.");
}

export default App;


