# PRISM

PRISM is a privacy-first file and productivity toolkit. The repository contains a Vercel-hosted browser trial and a shared React/TypeScript interface used by the Tauri desktop shell. The browser trial is designed to process supported inputs locally. It does not send selected file contents to a PRISM processing server; the website host may still process ordinary connection/request data to deliver the site.

## Current release status

- **Catalog:** 150 launchable browser workflows. Tool pages state supported formats and engine limits.
- **QA:** Catalog and route audits do not prove that all 150 workflows passed individual end-to-end fixtures; see [tool QA](prism/docs/tool-qa.md).
- **Browser features:** Per-tool limits and accepted formats, example-aware search, local favorites and presets, local file queues, preview-before-save flows, contextual safety notices, opt-in task recovery, and local feedback drafts.
- **Task recovery:** When enabled, selected files and settings are stored in the browser's IndexedDB. Reloading stops active JavaScript work; PRISM restores the draft so a user can run it again. It cannot continue computation while the page is closed.
- **Apps:** Download links stay disabled until real release artifacts exist. Windows is first; macOS and Linux follow, with Android and iOS planned.
- **Version:** `0.0.43` is intended to match the commit count after this release commit lands on `main`.

## Privacy and trust

Read [PRISM's privacy and network activity note](prism/public/privacy.html). It explains local file handling, browser storage, hosting requests, opt-in activity sharing, submitted feedback, and how to inspect network activity. Appearance preferences, favorites, presets, and feedback drafts use local storage; task recovery uses IndexedDB only when enabled. PRISM has no file-processing upload endpoint or third-party analytics/ad tracker. Optional first-party activity and explicit feedback use small Vercel Functions and Upstash storage when configured.

Do not describe the site as collecting no data: the host can receive standard request information. Update the privacy notice before introducing analytics, crash reporting, external fonts, payments, APIs, or other third-party services.

## Architecture

- **React + TypeScript + Vite:** website and shared interface.
- **Tauri 2:** native desktop wrapper; Rust command code and platform packaging live in `prism/src-tauri/`.
- **Browser processing:** supported routes use browser APIs and local libraries; they create separate outputs and leave original files unchanged.
- **Vercel:** Vite static site from the `prism/` project root plus metadata-only functions at `/api/activity`, `/api/feedback`, and protected `/api/admin`. Functions do not receive files.

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

Configure the Vercel project root as `prism`, framework as Vite, build command as `npm run build`, and output directory as `dist`. `prism/vercel.json` sets response security headers including a same-origin Content Security Policy. To store reporting data, connect Upstash Redis and set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and a private `PRISM_ADMIN_TOKEN` in Vercel Project Settings → Environment Variables. Keep these server-only; never use `VITE_` or `NEXT_PUBLIC_` prefixes. See [reporting setup](prism/docs/telemetry-feedback.md). A GitHub push deploys production only if this Vercel project is already connected to the `main` branch; confirm the resulting deployment and configured variables in Vercel.

## Documentation and policies

- [Detailed project guide](prism/README.md)
- [Privacy and network activity](prism/public/privacy.html)
- [Tool catalog, formats, and limits](prism/docs/tool-catalog.md)
- [Public roadmap](prism/docs/roadmap.md)
- [Tool QA and known limits](prism/docs/tool-qa.md)
- [Telemetry and feedback storage setup](prism/docs/telemetry-feedback.md)
- [Troubleshooting](prism/docs/troubleshooting.md)
- [Security reporting](prism/SECURITY.md)
- [Third-party notices](prism/THIRD_PARTY_NOTICES.md)
- [Changelog](prism/CHANGELOG.md)
- [MIT License](LICENSE)

## Feedback and security reports

Use the optional feedback form on a tool page to send a rating and optional short note to PRISM; it includes that tool and app context and never accepts file attachments. Use synthetic examples only and do not include passwords or personal information. For security reports, follow [SECURITY.md](prism/SECURITY.md) and do not publish exploit details before coordination.

## Release readiness

This is a browser-trial release candidate, not a verified final release for all platforms. The catalog has 150 launchable workflows, but the full per-tool input/output matrix remains incomplete. Windows, macOS, Linux, Android, and iOS download artifacts are not published. Before calling PRISM final, complete the tool QA matrix, verify file privacy in browser Network tools, configure and verify Vercel/Upstash reporting, enable GitHub private vulnerability reporting, and build/sign and verify the platform installers. See [known QA gaps](prism/docs/tool-qa.md) and the [roadmap](prism/docs/roadmap.md).

