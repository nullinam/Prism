# PRISM

PRISM is a privacy-first toolkit. This project contains the Vercel browser-trial website and the shared React interface used by the Tauri desktop shell.

## Website

- `src/catalog.ts` is the source of truth for the 150 tool entries, their categories, readiness, and browser-trial caps.
- The directory supports search and category filters. Cards disclose the trial cap and distinguish ready tools from tools still in development.
- Currently available browser tools: image-dimension inspection and five text utilities. The remaining entries are catalogued but not yet runnable.
- Browser limits for ready tools are enforced locally: 10 images at up to 20 MiB each for dimension inspection; up to 20,000 input characters for text tools.
- No file-upload endpoint, analytics, or account service is configured. The browser tools process inputs in the browser.

## Vercel setup

Set the Vercel project's **Root Directory** to `prism`. The detected framework is Vite, the build command is `npm run build`, and the output directory is `dist`. No serverless functions are needed for this static site. `vercel.json` adds baseline response security headers.

## Local development

```powershell
npm install
npm run dev
```

Create a production build with `npm run build`.

## App roadmap

Windows and macOS desktop builds follow the Vercel website, then Android and iOS. App download buttons remain disabled until signed installers are available.
