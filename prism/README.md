# PRISM

PRISM is a privacy-first toolkit. This project contains the Vercel browser-trial website and the shared React interface used by the Tauri desktop shell.

## Website

- `src/catalog.ts` is the source of truth for the catalog, tool availability, categories, and browser-trial caps. It currently lists 146 available tools and 4 PDF tools in development.
- The website supports search and category filters. Tool cards show the trial cap and whether the workflow is available or in development.
- 146 tools currently have browser workflows. PDF compression, PDF unlocking, PDF protection, and PDF image extraction remain marked in development until reliable local processing engines are implemented.
- File tools enforce browser caps in the tool runner. Image workflows allow up to 10 files at 20 MiB each and decode at most 40 megapixels per image; PDF workflows allow up to 2 PDFs with a 10 MiB total and 100 pages; text input is capped at 20,000 characters.
- The browser runner processes supported file contents locally and the repository has no file-upload endpoint, analytics SDK, ad tracker, account service, third-party script, or externally hosted font. The website is hosted on Vercel, which may process standard connection/request information to serve and operate the site; this is separate from selected file contents.
- The site stores appearance preferences in browser local storage and some trial counters in session storage. These values are not sent to a PRISM endpoint by the app.
- Read [How PRISM handles files](https://prism-khaki-one.vercel.app/privacy.html) for the user-facing privacy and network activity note. The deployed Content Security Policy restricts scripts and network connections to the site origin.
- Run `npm run audit:tools` for the catalog consistency audit. It checks IDs, metadata, availability totals, and explicit processing routes. A route reference is not a substitute for end-to-end behavioral QA; see `docs/tool-qa.md` for the tested coverage and known limits.

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

