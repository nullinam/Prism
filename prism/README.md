# PRISM

PRISM is a browser-first toolbox for common image, PDF, document, text, data, study, work, and utility tasks. The Vercel site is a limited trial and product overview. Its supported tool workflows run in the user's browser; the website does not send selected file contents to a PRISM processing server. See [the privacy and network note](public/privacy.html) for scope and limitations.

## Product status

- The catalog contains 150 launchable browser workflows. Several tools have explicit format or engine limits; see the catalog and per-tool notices.
- “Available” means a tool has a launchable browser workflow. It does not mean every file format or edge case has passed end-to-end QA. See [tool QA](docs/tool-qa.md).
- The trial imposes per-tool input, size, and run limits. The interface presents the relevant cap before selection.
- Desktop/mobile downloads are roadmap placeholders until real release artifacts are built, signed where supported, and linked.
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

Run the catalog consistency audit with `npm run audit:tools`. This checks catalog/route metadata; it is not a substitute for an end-to-end fixture run.

## Deploying to Vercel

Use the `prism` directory as the Vercel project root. Vite is the framework, `npm run build` is the build command, and `dist` is the output directory. No serverless file-processing functions are required. The deployment configuration adds response headers including a same-origin Content Security Policy. Confirm headers and privacy wording again whenever scripts, analytics, fonts, payment links, or remote services are added.

## Privacy and storage

- Selected files are read through browser APIs and processed in the page.
- Enabled task recovery saves inputs and settings in this browser's IndexedDB. Disable it or clear the recovered task from the tool page to remove that draft. Browser storage can be cleared through browser settings as well.
- Appearance choices, recent tool names, and feedback drafts use local storage; recent history never stores selected file names or paths. Trial counters may use session storage.
- Favorites and named per-tool presets use local storage in this browser. Presets can contain typed text and output settings, so the interface warns users not to save secrets or personal data in them.
- The site currently has no configured analytics SDK, ad tracker, PRISM account service, or file-upload route. Vercel and the browser still make ordinary requests to load the site; the host may receive connection/request data.
- Feedback text stays local until the user explicitly opens GitHub to submit it. Do not put private data into issue reports.

Read [privacy.html](public/privacy.html), [supported formats and limits](docs/tool-catalog.md), [public roadmap](docs/roadmap.md), [release notes](CHANGELOG.md), [security reporting](SECURITY.md), [troubleshooting](docs/troubleshooting.md), and [third-party notices](THIRD_PARTY_NOTICES.md).

## Accessibility and customization

The site defaults to light appearance and offers dark/system appearance, accent colors, font family, text scale, density, animation style/on-off, corner style, and high-contrast controls. Tool forms use keyboard focus styling and readable input text/carets. The interface respects reduced-motion preferences. Report accessibility issues through GitHub Issues, including browser and assistive technology details where relevant.

## License

The project is distributed under the MIT License in [`../LICENSE`](../LICENSE). Third-party packages retain their own licenses; see [third-party notices](THIRD_PARTY_NOTICES.md) and package metadata. Verify upstream license terms before adding or redistributing new components.

## Contributing and support

Open a GitHub issue at <https://github.com/nullinam/Prism/issues>. Include the tool name/ID, browser and OS, steps to reproduce, and expected versus observed behavior. Use synthetic examples; never upload confidential inputs. Security reports should follow [SECURITY.md](SECURITY.md).

## Release version

The web/app version currently follows the pushed commit count: `0.0.42` is intended to match 42 commits reachable from the repository's starting history after this release is pushed. Keep `package.json`, `src/version.ts`, and the release notes aligned. Update the count only after confirming the target branch history; do not count local, unpushed commits.

