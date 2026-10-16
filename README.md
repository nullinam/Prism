# PRISM

PRISM is a privacy-first file and productivity toolkit. The repository contains a Vercel-hosted browser trial and a shared React/TypeScript interface used by the Tauri desktop shell. The browser trial is designed to process supported inputs locally. It does not send selected file contents to a PRISM processing server; the website host may still process ordinary connection/request data to deliver the site.

## Current release status

- **Catalog:** 150 launchable browser workflows. Tool pages state supported formats and engine limits.
- **QA:** Catalog and route audits do not prove that all 150 workflows passed individual end-to-end fixtures; see [tool QA](prism/docs/tool-qa.md).
- **Browser features:** Per-tool limits and accepted formats, local file queue with drag/drop, preview-before-save flows, contextual safety notices, opt-in local task recovery, and a local feedback draft.
- **Task recovery:** When enabled, selected files and settings are stored in the browser's IndexedDB. Reloading stops active JavaScript work; PRISM restores the draft so a user can run it again. It cannot continue computation while the page is closed.
- **Apps:** Download links stay disabled until real release artifacts exist. Windows is first; macOS and Linux follow, with Android and iOS planned.
- **Version:** `0.0.41` is intended to match the count of commits reachable from the default branch after this release lands.

## Privacy and trust

Read [PRISM's privacy and network activity note](prism/public/privacy.html). It explains local file handling, browser storage, hosting requests, feedback handoff to GitHub, and how to inspect network activity. Appearance preferences and feedback drafts use local storage; task recovery uses IndexedDB only when enabled. Browser trial features do not use an analytics SDK, ad tracker, account service, or PRISM file upload endpoint.

Do not describe the site as collecting no data: the host can receive standard request information. Update the privacy notice before introducing analytics, crash reporting, external fonts, payments, APIs, or other third-party services.

## Architecture

- **React + TypeScript + Vite:** website and shared interface.
- **Tauri 2:** native desktop wrapper; Rust command code and platform packaging live in `prism/src-tauri/`.
- **Browser processing:** supported routes use browser APIs and local libraries; they create separate outputs and leave original files unchanged.
- **Vercel:** static website deployment from the `prism/` project root; no serverless file-processing endpoint is required.

## Development

Install a supported Node.js runtime and npm, then:

```powershell
cd prism
npm ci
npm run dev
```

Create and preview a production build:

```powershell
npm run build
npm run preview
```

Run the catalog consistency audit:

```powershell
npm run audit:tools
```

The audit confirms catalog IDs, metadata, totals, and runner route references. It does not execute tool behavior. See [supported formats and limits](prism/docs/tool-catalog.md), [troubleshooting](prism/docs/troubleshooting.md), and [tool QA](prism/docs/tool-qa.md).

## Vercel deployment

Configure the Vercel project root as `prism`, framework as Vite, build command as `npm run build`, and output directory as `dist`. `prism/vercel.json` sets response security headers including a same-origin Content Security Policy. Confirm deployed response headers and privacy wording after changing network behavior or dependencies.

## Documentation and policies

- [Detailed project guide](prism/README.md)
- [Privacy and network activity](prism/public/privacy.html)
- [Tool catalog, formats, and limits](prism/docs/tool-catalog.md)
- [Tool QA and known limits](prism/docs/tool-qa.md)
- [Troubleshooting](prism/docs/troubleshooting.md)
- [Security reporting](prism/SECURITY.md)
- [Third-party notices](prism/THIRD_PARTY_NOTICES.md)
- [Changelog](prism/CHANGELOG.md)
- [MIT License](LICENSE)

## Feedback and security reports

Open a [GitHub issue](https://github.com/nullinam/Prism/issues). Include a tool name/ID, browser and OS, steps, and expected versus actual behavior. Use synthetic examples only; do not attach private files, passwords, or personal information. For security reports, follow [SECURITY.md](prism/SECURITY.md) and do not publish exploit details before coordination.
