# PRISM

PRISM is a privacy-first toolkit. This project contains the Vercel browser-trial website and the shared React interface used by the Tauri desktop shell.

## Website

- `src/catalog.ts` is the source of truth for all 150 tools, their categories, current status, and browser-trial caps.
- The website supports search and category filters. Tool cards show the trial cap and whether the workflow is available or in development.
- 146 tools currently have browser workflows. PDF compression, PDF unlocking, PDF protection, and PDF image extraction are marked in development until their processing engines are implemented.
- File tools enforce browser caps in the tool runner. Image workflows allow up to 10 files at 20 MiB each; PDF workflows allow up to 2 PDFs with a 10 MiB total and 100 pages; text input is capped at 20,000 characters.
- No file-upload endpoint, analytics, or account service is configured. Supported inputs are processed in the browser, and source files are left unchanged.
- Run `npm run audit:tools` to check that catalog IDs are unique and complete, every entry has its required metadata, and each tool has an explicit runner route.

## Vercel setup

Set the Vercel project's **Root Directory** to `prism`. The detected framework is Vite, the build command is `npm run build`, and the output directory is `dist`. No serverless functions are needed for this static site. `vercel.json` adds baseline response security headers.

## Local development

```powershell
npm install
npm run dev
```

Create a production build with `npm run build`, then run the catalog consistency audit with `npm run audit:tools`.

## App roadmap

Windows and macOS desktop builds follow the Vercel website, then Android and iOS. App download buttons remain disabled until signed installers are available.
