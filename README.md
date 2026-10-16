# PRISM

PRISM is a privacy-first toolkit for image, PDF, document, and everyday file tasks. The roadmap starts with the Vercel website and 150-tool catalog, followed by Windows and macOS apps, then Android and iOS.

## Architecture

- **React + TypeScript:** shared site and workspace interface.
- **Tauri 2:** native desktop shell with a small system WebView.
- **Rust:** local processing engine and batch orchestration.
- **Native codecs/libraries:** integrated behind narrow Rust adapters when they improve format coverage or performance.
- **PDF engine:** to be selected against the required feature set, licensing, and Windows/macOS/Linux support.
- **Office adapter:** DOCX/ODT conversion stays behind a separate boundary. Select a suitable Java or .NET engine after verifying output quality and target support; PRISM will not depend on both by default.
- **Simple tools:** implemented in TypeScript or Rust according to where the work runs.

The Vercel website is the first release target: a static product site and capped browser trial. It has no file-upload endpoint. Every catalog entry carries its planned browser-trial cap; only tools marked ready are currently runnable. The trial limits currently enforced are 10 images up to 20 MiB each for image inspection and 20,000 input characters for text utilities. Other category caps are planned limits, not yet enforced by a runnable tool.

## Current slice

The catalog has all 150 tools from the supplied list, with 10 categories, per-tool trial caps, and readiness status. Six tools are currently ready: Inspect image dimensions and five text utilities. The browser inspector reads a bounded header slice for common image formats. The Tauri command uses Rust's image reader to obtain dimensions from selected local paths sequentially.

## Development

```powershell
cd prism
npm install
npm run dev
```

For the Windows app, install the Rust stable toolchain, Microsoft C++ Build Tools, and WebView2 runtime, then run:

```powershell
npm run tauri dev
```

Build the static Vercel site with `npm run build` from `prism/`. Select `prism/` as the Vercel project root; the build output is `dist/`.

## Planned platform order

Vercel 150-tool website first; Windows and macOS apps second; Android and iOS apps third. Linux can be added after these milestones are stable.
