# PRISM

PRISM is a browser-first toolbox for common image, PDF, document, text, data, study, work, and utility tasks. The Vercel site is a limited trial and product overview. Its supported tool workflows run in the user's browser; the website does not send selected file contents to a PRISM processing server. See [the privacy and network note](public/privacy.html) for scope and limitations.

## Product status

- The catalog contains 150 launchable browser workflows. Several tools have explicit format or engine limits; see the catalog and per-tool notices.
- Tool lists are alphabetical when no search is entered. Search accepts task descriptions such as “make a photo smaller”; matching runs locally against tool names, examples, and descriptions.
- “Available” means a tool has a launchable browser workflow. It does not mean every file format or edge case has passed end-to-end QA. See [tool QA](docs/tool-qa.md).
- The trial imposes per-tool input, size, and run limits. The interface presents the relevant cap before selection.
- PRISM is currently available on the web. A Windows application is planned; no Windows or other platform download is available. macOS, Android, iOS, and Linux apps are not currently offered.
- Browser task recovery stores selected inputs and settings in IndexedDB when enabled. A reload interrupts JavaScript processing; the page restores the draft so the user can run it again. It cannot continue CPU work in the background.

## Getting started

Requirements: a supported Node.js runtime and npm. The lockfile is committed.

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite. To create the production static bundle:

```powershell
npm run build
npm run preview
```

Run `npm run test:search` for local alphabetical and plain-language search assertions, and `npm run audit:tools` for catalog/route metadata. Neither command is a substitute for an end-to-end fixture run.

## Deploying to Vercel

Use the `prism` directory as the Vercel project root. Vite is the framework, `npm run build` is the build command, and `dist` is the output directory. Three metadata-only serverless functions provide opt-in activity, explicit feedback, and private reporting; no file-processing function exists. Configure the server-side variables listed in `.env.example` to enable persistence. The deployment configuration adds response headers including a same-origin Content Security Policy. Confirm headers and privacy wording again whenever scripts, analytics, fonts, payment links, or remote services are added.

## Privacy and storage

- Selected files are read through browser APIs and processed in the page.
- Enabled task recovery saves inputs and settings in this browser's IndexedDB. Disable it or clear the recovered task from the tool page to remove that draft. Browser storage can be cleared through browser settings as well.
- Appearance choices, recent tool names, and feedback drafts use local storage; recent history never stores selected file names or paths. Trial counters may use session storage.
- Favorites and named per-tool presets use local storage in this browser. Presets can contain typed text and output settings, so the interface warns users not to save secrets or personal data in them.
- PRISM has no third-party analytics SDK, ad tracker, account service, or file-processing upload route. Vercel and the browser make ordinary site requests; the host may receive connection/request data.
- Optional first-party activity sharing is off by default. When enabled, it sends tool ID/name, platform, app version, and action to `/api/activity`. Submitted feedback sends tool ID/name, platform, app version, rating, and the optional note to `/api/feedback`. Neither endpoint receives files, filenames, paths, or tool inputs.
- Accepted activity and feedback records are stored in Upstash Redis only after the Vercel environment is configured. Activity is capped at 2,000 records and feedback at 500; rate limiting uses a keyed IP hash, while stored app records exclude raw IP addresses. See [telemetry and feedback setup](docs/telemetry-feedback.md).

For local serverless development, copy `.env.example` to `.env.local` and fill values only for a trusted local setup. `.env.local` is ignored by Git. In Vercel, set the same names under Project Settings → Environment Variables and redeploy. Keep every value server-only; do not prefix it with `VITE_` or `NEXT_PUBLIC_`. Feedback cannot be retained while Redis is unconfigured; the API reports that it was not submitted.

Read [privacy.html](public/privacy.html), [supported formats and limits](docs/tool-catalog.md), [public roadmap](docs/roadmap.md), [release notes](CHANGELOG.md), [telemetry/feedback setup](docs/telemetry-feedback.md), [security reporting](SECURITY.md), [troubleshooting](docs/troubleshooting.md), and [third-party notices](THIRD_PARTY_NOTICES.md).

## Accessibility and customization

The site defaults to light appearance and offers dark/system appearance, accent colors, font family, text scale, density, animation style/on-off, corner style, and high-contrast controls. Tool forms use keyboard focus styling and readable input text/carets. The interface respects reduced-motion preferences. Report accessibility issues through GitHub Issues, including browser and assistive technology details where relevant.

## License

The project is distributed under the MIT License in [`../LICENSE`](../LICENSE). Third-party packages retain their own licenses; see [third-party notices](THIRD_PARTY_NOTICES.md) and package metadata. Verify upstream license terms before adding or redistributing new components.

## Contributing and support

Open a GitHub issue at <https://github.com/nullinam/Prism/issues>. Include the tool name/ID, browser and OS, steps to reproduce, and expected versus observed behavior. Use synthetic examples; never upload confidential inputs. Security reports should follow [SECURITY.md](SECURITY.md).

## Release version

The web/app version follows the pushed commit count. `0.0.43` matches the expected count after this release commit is pushed to `main`. Keep `package.json`, `package-lock.json`, `src/version.ts`, the Tauri app version, and release notes aligned. Update the count only after confirming the default-branch history.

