import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";
import "./marketing.css";
import { tools, type Tool } from "./catalog";
import { ToolRunner } from "./ToolRunner";

type ImageInfo = {
  name: string;
  width: number | null;
  height: number | null;
  format: string;
  size_bytes: number;
  error?: string | null;
};

type ImageRow = ImageInfo & { id: string };
type SiteSettings = { theme: "light" | "dark" | "system"; accent: "lime" | "blue" | "coral" | "violet"; font: "manrope" | "inter" | "system"; size: "compact" | "comfortable" | "large"; density: "comfortable" | "compact"; motion: boolean; motionStyle: "soft" | "playful"; corners: "soft" | "bubbly" };
const defaultSettings: SiteSettings = { theme: "light", accent: "lime", font: "manrope", size: "comfortable", density: "comfortable", motion: true, motionStyle: "playful", corners: "soft" };

const isDesktop = "__TAURI_INTERNALS__" in window;
const WEB_MAX_FILES = 10;
const WEB_MAX_FILE_BYTES = 20 * 1024 * 1024;



function PrismMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`prism-mark${small ? " prism-mark-small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 114 114">
        <path fill="currentColor" d="M54 32 31 66 54 84zM60 32l23 34-23 18z" />
      </svg>
    </span>
  );
}

function App() {
  const [screen, setScreen] = useState<"site" | "workspace">(isDesktop ? "workspace" : "site");
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (screen === "workspace") {
    return <Workspace onHome={() => { setActiveTool(null); setScreen("site"); }} onTool={setActiveTool} activeTool={activeTool} />;
  }

  return <MarketingSite onOpen={(tool) => { setActiveTool(tool ?? null); setScreen("workspace"); }} />;
}

function MarketingSite({ onOpen }: { onOpen: (tool?: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All tools");
  const [showAll, setShowAll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [mode, setMode] = useState<"beginner" | "advanced">("beginner");
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem("prism-site-settings") ?? "{}") }; } catch { return defaultSettings; }
  });
  useEffect(() => { localStorage.setItem("prism-site-settings", JSON.stringify(settings)); }, [settings]);
  const categories = ["All tools", ...Array.from(new Set(tools.map(tool => tool.category)))];
  const filtered = useMemo(() => tools.filter(tool =>
    (category === "All tools" || tool.category === category) &&
    `${tool.name} ${tool.category}`.toLowerCase().includes(query.toLowerCase())
  ), [category, query]);
  const visible = showAll || query || category !== "All tools" ? filtered : filtered.slice(0, 12);
  const readyCount = tools.filter(tool => tool.status === "ready").length;

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
  return <div className={`site-v2 theme-${settings.theme} accent-${settings.accent} font-${settings.font} size-${settings.size} density-${settings.density} motion-${settings.motionStyle} corners-${settings.corners} ${settings.motion ? "" : "reduce-motion"}`}>
    <header className="site-v2-header"><a className="brand" href="#top"><PrismMark/><span>PRISM</span></a><nav aria-label="Main navigation"><a href="#tools">Tools</a><a href="#pricing">Plans</a><a href="#privacy">Privacy</a><a href="#apps">Apps</a></nav><button className="settings-trigger" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog">⚙ <span>Settings</span></button><a className="v2-header-cta" href="#tools">Explore tools <span>↘</span></a></header>
    <main id="top">
      <section className="v2-hero"><div className="v2-hero-copy"><div className="v2-eyebrow"><span/> PRIVATE BY DESIGN <i/> BROWSER TRIAL</div><h1>Good tools.<br/>Your files.<br/><em>Your device.</em></h1><p>150 practical tools for images, PDFs, documents, data, study, and everyday work. Try available tools in your browser with clear limits on every tool.</p><div className="v2-hero-actions"><a className="v2-button primary" href="#tools">Browse all 150 <span>↘</span></a><a className="v2-button secondary" href="#privacy">How privacy works</a></div><div className="v2-hero-note"><span>▣</span> No file uploads <b>·</b> Browser trial caps <b>·</b> Full apps planned</div></div>
        <div className="v2-hero-art"><div className="v2-orbit orbit-a"/><div className="v2-orbit orbit-b"/><div className="v2-glass-card"><div className="v2-card-top"><PrismMark small/><span>PRISM TOOLBOX</span><i>LOCAL</i></div><div className="v2-card-title">A little less<br/>file busywork.</div><div className="v2-card-tools"><div><span>▧</span> Images <b>15</b></div><div><span>▤</span> PDF <b>15</b></div><div><span>▱</span> Documents <b>15</b></div><div><span>✳</span> Everyday <b>105</b></div></div><div className="v2-card-foot"><span><i/> {readyCount} tools available now</span><span>150 total</span></div></div><div className="v2-float-badge">Files stay here <span>↗</span></div></div>
      </section>
      <div className="v2-trust"><span><b>01</b> Pick a tool</span><i/><span><b>02</b> Work in your browser</span><i/><span><b>03</b> Save your result</span><i/><span><b>04</b> Your file stays yours</span></div>
      <section className="v2-tools" id="tools"><div className="v2-section-head"><div><span className="v2-overline">THE PRISM TOOLBOX</span><h2>Find your next<br/>small win.</h2></div><p>Every tool shows its browser trial cap up front. All 150 tools open in the local trial. Each tool shows its current cap and processes selected content on your device.</p></div>
        <div className="v2-controls"><label className="v2-search"><span>⌕</span><input value={query} onChange={e=>{setQuery(e.target.value);setShowAll(false);}} placeholder="Search 150 tools" aria-label="Search all PRISM tools"/><kbd>150</kbd></label><div className="v2-filters" role="group" aria-label="Filter tools by category">{categories.map(item=><button key={item} className={category===item?"selected":""} onClick={()=>{setCategory(item);setShowAll(false);}}>{item}</button>)}</div></div>
        <div className="v2-results"><span>{filtered.length} tools</span><span>{readyCount} available in this trial</span></div>
        <div className="v2-tool-grid">{visible.map(tool=><article className="v2-tool-card" key={tool.id}><div className="v2-tool-card-top"><span className="v2-tool-number">{String(tool.id).padStart(3,"0")}</span><span className={`v2-status ${tool.status}`}>{tool.status === "ready" ? "READY TO TRY" : "IN DEVELOPMENT"}</span></div><div className="v2-tool-icon">{tool.category === "Images" ? "▧" : tool.category === "PDF" ? "▤" : tool.category === "Documents" ? "▱" : tool.category === "Calculators" ? "∑" : "✳"}</div><h3>{tool.name}</h3><span className="v2-tool-category">{tool.category}</span><div className="v2-limit"><small>{tool.status === "ready" ? "BROWSER TRIAL LIMIT" : "PLANNED TRIAL CAP"}</small><span>{tool.trialLimit}</span></div><button className="v2-tool-action" onClick={()=>tool.status === "ready" ? onOpen(tool.name) : (setSelectedTool(tool), setMode("beginner"))}>{tool.status === "ready" ? "Try this tool" : "Explore design"} <span>↗</span></button></article>)}</div>
        {!showAll && !query && category === "All tools" && filtered.length > visible.length && <button className="v2-load-more" onClick={()=>setShowAll(true)}>Show all 150 tools <span>↓</span></button>}
        {filtered.length===0&&<div className="v2-empty">No tools match that search. Try a different word or category.</div>}
      </section>
      <section className="v2-privacy" id="privacy"><div className="v2-privacy-copy"><span className="v2-overline">A SIMPLE PRIVACY PROMISE</span><h2>Your files stay<br/>on your device.</h2><p>The browser trial processes supported inputs locally in your browser. PRISM has no file upload service. Trial caps keep browser workloads manageable; installable apps will provide higher limits as they become available.</p><div className="v2-privacy-points"><span><i>✓</i> No file uploads</span><span><i>✓</i> No account needed for trial tools</span><span><i>✓</i> Clear limits before you start</span></div></div><div className="v2-privacy-visual"><div className="v2-privacy-ring ring-1"/><div className="v2-privacy-ring ring-2"/><div className="v2-privacy-center"><PrismMark/><span>ON YOUR<br/>DEVICE</span></div><div className="v2-privacy-dot dot-1"/><div className="v2-privacy-dot dot-2"/></div></section>
      <section className="v2-pricing" id="pricing"><div className="v2-pricing-heading"><span className="v2-overline">SIMPLE, HONEST PLANS</span><h2>Start free.<br/><em>Upgrade when you’re ready.</em></h2><p>Try PRISM in your browser today. Paid desktop plans are being shaped around higher limits and more control; pricing will be shared before they launch.</p></div><div className="v2-plan-grid"><article className="v2-plan-card"><span className="v2-plan-label">BROWSER TRIAL</span><h3>Free</h3><p className="v2-plan-summary">A private way to try PRISM tools.</p><ul><li>150 tools in the catalog</li><li>Browser trial caps shown up front</li><li>Files processed on your device</li></ul><a className="v2-button secondary" href="#tools">Explore the free trial <span>↘</span></a></article><article className="v2-plan-card featured"><span className="v2-plan-label">IN DEVELOPMENT</span><h3>PRISM Desktop</h3><p className="v2-plan-summary">A fuller workspace for frequent, larger jobs.</p><ul><li>Higher file and batch limits</li><li>More room for local workflows</li><li>Windows release first; other platforms planned</li></ul><a className="v2-button primary" href="#apps">See the app roadmap <span>↗</span></a></article></div><p className="v2-pricing-note">No payment is collected on this site. We’ll publish exact features and pricing when the desktop edition is ready.</p></section>
      <section className="v2-apps" id="apps"><div className="v2-apps-heading"><div><span className="v2-overline">THE FULL PRISM WORKSPACE</span><h2>Take PRISM<br/>with you.</h2></div><p>Installed apps will raise browser trial limits and support more local workflows. We’ll publish download links here as signed builds are ready.</p></div><div className="v2-platform-grid">{[["⊞","Windows","Desktop app","In development"],["⌘","macOS","Desktop app","Planned"],["◉","Android","Mobile app","Planned"],["◌","iOS","Mobile app","Planned"],["⌘","Linux","Desktop app","Planned"]].map(([icon,name,detail,status])=><article className="v2-platform-card" key={name}><span className="platform-icon">{icon}</span><div><h3>{name}</h3><p>{detail}</p></div><span className="platform-status">{status}</span><button className="v2-platform-download" disabled aria-label={`${name} download coming soon`}>Download when ready <span>↗</span></button></article>)}</div></section>
      <section className="v2-final-cta"><div><span className="v2-overline">START WITH A SMALL WIN</span><h2>Browse the tools.<br/>Keep the files.</h2></div><a className="v2-button primary" href="#tools">Explore PRISM <span>↗</span></a></section>
    </main><footer className="v2-footer"><a className="brand" href="#top"><PrismMark/><span>PRISM</span></a><span>Private browser trials. Installable apps in development.</span><div><a href="#tools">Tools</a><a href="#pricing">Plans</a><a href="#privacy">Privacy</a><a href="#apps">Apps</a><a href="https://github.com/nullinam/Prism">GitHub</a><button onClick={() => setSettingsOpen(true)}>Settings · v0.1.0</button></div></footer>
    {settingsOpen && <div className="prism-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSettingsOpen(false);}}><section className="prism-dialog settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title"><button className="dialog-close" onClick={()=>setSettingsOpen(false)} aria-label="Close settings">×</button><span className="v2-overline">PERSONALIZE YOUR SPACE</span><h2 id="settings-title">Settings</h2><p className="dialog-intro">Make PRISM feel right for you. Preferences stay in this browser.</p><div className="settings-version"><span>Web trial</span><strong>Version 0.1.0</strong></div><div className="settings-grid"><label>Appearance<select value={settings.theme} onChange={e=>updateSetting("theme",e.target.value as SiteSettings["theme"])}><option value="light">Light</option><option value="dark">Dark</option><option value="system">Use device setting</option></select></label><label>Accent color<select value={settings.accent} onChange={e=>updateSetting("accent",e.target.value as SiteSettings["accent"])}><option value="lime">Prism lime</option><option value="blue">Sky blue</option><option value="coral">Soft coral</option><option value="violet">Violet</option></select></label><label>Font<select value={settings.font} onChange={e=>updateSetting("font",e.target.value as SiteSettings["font"])}><option value="manrope">Manrope</option><option value="inter">Inter</option><option value="system">System font</option></select></label><label>Text size<select value={settings.size} onChange={e=>updateSetting("size",e.target.value as SiteSettings["size"])}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label><label>Layout density<select value={settings.density} onChange={e=>updateSetting("density",e.target.value as SiteSettings["density"])}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label>Motion style<select value={settings.motionStyle} onChange={e=>updateSetting("motionStyle",e.target.value as SiteSettings["motionStyle"])}><option value="soft">Soft float</option><option value="playful">Playful bounce</option></select></label><label>Card corners<select value={settings.corners} onChange={e=>updateSetting("corners",e.target.value as SiteSettings["corners"])}><option value="soft">Soft</option><option value="bubbly">Extra rounded</option></select></label></div><label className="settings-switch"><span><strong>Motion effects</strong><small>Allow subtle movement and transitions</small></span><input type="checkbox" checked={settings.motion} onChange={e=>updateSetting("motion",e.target.checked)}/></label><div className="dialog-actions"><button className="v2-button primary" onClick={()=>setSettingsOpen(false)}>Done</button><button className="text-button" onClick={()=>setSettings(defaultSettings)}>Reset to defaults</button></div></section></div>}
    {selectedTool && <div className="prism-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedTool(null);}}><section className="prism-dialog tool-design-dialog" role="dialog" aria-modal="true" aria-labelledby="tool-design-title"><button className="dialog-close" onClick={()=>setSelectedTool(null)} aria-label="Close tool design">×</button><span className="v2-overline">{selectedTool.category.toUpperCase()} · TOOL {String(selectedTool.id).padStart(3,"0")}</span><h2 id="tool-design-title">{selectedTool.name}</h2><div className="design-tabs" role="tablist" aria-label="Tool experience level"><button role="tab" aria-selected={mode==="beginner"} className={mode==="beginner"?"selected":""} onClick={()=>setMode("beginner")}>Beginner</button><button role="tab" aria-selected={mode==="advanced"} className={mode==="advanced"?"selected":""} onClick={()=>setMode("advanced")}>Advanced</button></div><div className="design-description"><span>{mode === "beginner" ? "A SIMPLE START" : "MORE CONTROL"}</span><p>{selectedTool[mode]}</p></div><div className="design-example"><span>TRY THIS</span><p>{selectedTool.example}</p><span>PREVIEW BEFORE SAVING</span><p>{selectedTool.preview}</p></div><div className="design-options"><h3>{mode === "beginner" ? "Starter workflow" : "Advanced options"}</h3><ul>{selectedTool[mode].split(/,\s*|;\s*/).filter(Boolean).map((item,index)=><li key={`${item}-${index}`}><i>✓</i>{item.trim().replace(/\.$/,"")}</li>)}</ul></div><div className="design-cap"><span>Browser trial limit</span><strong>{selectedTool.trialLimit}</strong></div><div className="design-foot"><span>{selectedTool.status === "ready" ? "Available to try" : "Design preview · This tool is not available yet"}</span>{selectedTool.status === "ready" && <button className="v2-button primary" onClick={()=>{const name=selectedTool.name;setSelectedTool(null);onOpen(name);}}>Try this tool ↗</button>}</div></section></div>}
  </div>;
}
function Workspace({ onHome, onTool, activeTool }: { onHome: () => void; onTool: (tool: string | null) => void; activeTool: string | null }) {
  const [query, setQuery] = useState("");
  const filteredTools = useMemo(() => tools.filter((tool) => tool.name.toLowerCase().includes(query.toLowerCase())), [query]);
  const openTool = (tool: string) => onTool(tool);

  return <div className="app-shell">
    <aside className="app-sidebar">
      <a className="brand app-brand" href="#home" onClick={(event) => { event.preventDefault(); onTool(null); }}><PrismMark /><span>PRISM</span></a>
      <div className="sidebar-label">Workspace</div>
      <button className={`sidebar-item ${!activeTool ? "active" : ""}`} onClick={() => onTool(null)}><span>⌂</span> Home</button>
      <button className="sidebar-item" onClick={() => onTool("Recent files")}><span>◷</span> Recent files</button>
      <div className="sidebar-label">Toolbox</div>
      <button className={`sidebar-item ${activeTool ? "active" : ""}`} onClick={() => onTool("Browse image tools")}><span>▧</span> Images</button>
      <button className="sidebar-item" onClick={() => onTool("PDF tools")}><span>▤</span> PDF tools</button>
      <button className="sidebar-item" onClick={() => onTool("Document tools")}><span>▱</span> Documents</button>
      <button className="sidebar-item" onClick={() => onTool("Everyday tools")}><span>✳</span> Everyday</button>
      <div className="sidebar-bottom"><div className="privacy-badge"><i /> Files stay on this device</div><button onClick={onHome}>About PRISM ↗</button></div>
    </aside>
    <main className="workspace-main">
      <header className="workspace-header"><div className="breadcrumb">PRISM <span>/</span> {activeTool ?? "Workspace"}</div><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all tools" aria-label="Search tools" /><kbd>⌘ K</kbd></label><div className="local-status"><i /> Local processing</div></header>
      {(activeTool === "Inspect dimensions" || activeTool === "Inspect image dimensions") ? <ImageInspector /> : activeTool && ["Change text case", "Clean extra spaces and blank lines", "Remove duplicate lines", "Sort lines", "Find and replace text"].includes(activeTool) ? <TextUtility tool={activeTool} /> : activeTool && tools.find(tool => tool.name === activeTool) ? <ToolRunner tool={tools.find(tool => tool.name === activeTool)!} onBack={() => onTool("")} /> : activeTool ? <ToolPicker tools={filteredTools} onTool={openTool} activeTool={activeTool} /> : <HomeWorkspace onTool={openTool} />}
    </main>
  </div>;
}

function HomeWorkspace({ onTool }: { onTool: (tool: string) => void }) {
  return <div className="workspace-content">
    <div className="welcome-row"><div><span className="kicker">YOUR WORKSPACE</span><h1>A little more room<br />to get things done.</h1><p>Choose a tool and keep moving. Your files are processed locally in this workspace.</p></div><div className="welcome-mark"><PrismMark /></div></div>
    <button className="drop-card" onClick={() => onTool("Browse image tools")}><span className="drop-card-icon">＋</span><strong>Choose a tool to begin</strong><small>Start with images, PDFs, documents, or everyday utilities</small></button>
    <div className="tool-section-title"><div><h2>Explore all 150 tools</h2><p>Search or browse the PRISM catalog</p></div><span>{tools.filter(t => t.status === "ready").length} ready · {tools.length} listed</span></div>
    <div className="tool-grid">{tools.map((tool, index) => <ToolCard key={tool.id} tool={tool} index={index} onClick={() => onTool(tool.name)} />)}</div>
    <div className="workspace-footnote"><span>✳</span> All 150 catalog tools have a local trial workflow. File tools process selected files in your browser; saved work stays in this browser.</div>
  </div>;
}

function ToolCard({ tool, index, onClick }: { tool: Tool; index: number; onClick: () => void }) {
  return <button className="tool-card" onClick={onClick}><span className={`tool-icon tint-${index % 4}`}>{["▧", "▤", "▱", "✳"][index % 4]}</span><strong>{tool.name}</strong><small>{tool.category} · Ready to use</small><span className={`tool-state ${tool.status}`}>READY</span></button>;
}

function ToolPicker({ tools: visibleTools, onTool, activeTool }: { tools: Tool[]; onTool: (tool: string) => void; activeTool: string }) {
  const categories: Record<string, string[]> = { "Browse image tools": ["Images"], "PDF tools": ["PDF"], "Document tools": ["Documents"], "Everyday tools": ["Text", "Data", "Files", "Calculators", "Study", "Work", "Utilities"] };
  const selected = categories[activeTool];
  const items = selected ? visibleTools.filter(t => selected.includes(t.category)) : visibleTools;
  const title = ["Browse image tools", "PDF tools", "Document tools", "Everyday tools"].includes(activeTool) ? activeTool.replace("Browse ", "") : activeTool;
  return <div className="workspace-content"><div className="tool-page-heading"><span className="kicker">{items.length} TOOLS · LOCAL FIRST</span><h1>{title}</h1><p>Browse the 150-tool PRISM catalog. Trial caps apply to each tool and work is processed locally.</p></div><div className="tool-grid">{items.map((tool, index) => <ToolCard key={tool.id} tool={tool} index={index} onClick={() => onTool(tool.name)} />)}</div></div>;
}

function TextUtility({ tool }: { tool: string }) {
  const [text, setText] = useState(""); const [find, setFind] = useState(""); const [replace, setReplace] = useState(""); const [output, setOutput] = useState("");
  function run() {
    const lines = text.split(/\r?\n/); let result = text;
    if (tool === "Change text case") result = text.toUpperCase();
    if (tool === "Clean extra spaces and blank lines") result = lines.map(line => line.trim().replace(/\s+/g, " ")).filter(Boolean).join("\n");
    if (tool === "Remove duplicate lines") result = [...new Set(lines)].join("\n");
    if (tool === "Sort lines") result = lines.sort((a,b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })).join("\n");
    if (tool === "Find and replace text") result = find ? text.split(find).join(replace) : text;
    setOutput(result);
  }
  return <div className="workspace-content tool-workspace"><div className="tool-page-heading"><span className="kicker">TEXT TOOL · LOCAL</span><h1>{tool}</h1><p>Text is processed on this device. Browser trial limit: 20,000 input characters.</p></div>{tool === "Find and replace text" && <div className="text-options"><input aria-label="Find" placeholder="Find" value={find} onChange={e=>setFind(e.target.value)} /><input aria-label="Replace with" placeholder="Replace with" value={replace} onChange={e=>setReplace(e.target.value)} /></div>}<textarea className="text-work-area" maxLength={20000} value={text} onChange={e=>setText(e.target.value)} placeholder="Paste or type up to 20,000 characters…" /><div className="text-actions"><button className="button button-dark" onClick={run}>Apply tool</button><span>{text.length.toLocaleString()} / 20,000 characters</span></div>{output && <><textarea className="text-work-area" readOnly value={output} aria-label="Result" /><button className="button button-light" onClick={()=>navigator.clipboard.writeText(output)}>Copy result</button></>}</div>;
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
      setMessage(`The browser preview accepts up to ${WEB_MAX_FILES} files at a time. The installed app is designed for larger batches.`);
      return;
    }
    if (!isDesktop && chosen.some((file) => file.size > WEB_MAX_FILE_BYTES)) {
      setMessage("One or more files exceed the browser preview limit of 20 MB per file. Use the Windows app for larger files.");
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
    <div className="tool-page-heading"><span className="kicker">IMAGE TOOL · 01</span><h1>Inspect dimensions</h1><p>Check each image’s dimensions, format, and file size. The Windows version reads image metadata locally without sending files anywhere.</p></div>
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
  throw new Error("This image format is not supported in the browser preview. Try the Windows app.");
}

export default App;

