# Changelog

## Unreleased — PRISM 2 discovery and interface review

- Changed default catalog and category ordering to zero-padded numeric tool IDs; local search keeps relevance ranking and uses IDs to break ties.
- Added immediate, on-device hero suggestions for task searches. PDF image-removal queries explain that PRISM can export embedded JPEGs or remove whole pages, but cannot erase one image inside a page.
- Added expandable, keyboard-accessible “What this tool does” guidance to catalog and workspace cards.
- Replaced catalog “available/development” totals with an honest listing count and a note that QA verification is tracked separately.
- Replaced the repeated closing catalog call to action with concise file-tool input and output guidance.
- Isolated settings scrolling, locked background scrolling, added Escape closing, restored scroll styles and focus when settings closes, and contained overscroll.
- Clarified output-name, extension, format, and browser-download controls in the local preview panel.
- Full tool QA remains separate from this UI update.

## Unreleased — Task-first tool discovery

- Added a plain-language task search to the homepage hero, with common task examples that take visitors directly to matching tools.
- Styled the entry point for light, dark, and system themes, with mobile sizing and visible keyboard focus.

## Unreleased — Documents workflow corrections

- Routed five document utilities through the shared tool runner so they use the same notices, limits, previews, and save flow.
- Added missing case, duplicate, sorting, replacement, comparison, JSON output, and CSV delimiter controls.
- Fixed title-case output, multiline comparison input, HTML block separation, and the malformed-JSON formatting error.
- Marked Read text file as limited and aligned its description with its 20,000-character preview cap.

## Unreleased — Text workflow improvements and honest limits

- Fixed Lorem ipsum generation so it works without source text and distributes the exact requested word count across paragraphs.
- Added Text options for paragraph count, slug length/separator, reverse mode, repeat separator, line-number formatting, split length, find match mode, and URL-safe Base64.
- Removed duplicate Text controls and added clear UTF-8-only scope for Base64 decoding.
- Marked Text tools Limited and corrected descriptions to match implemented behavior and missing advanced features.

## Unreleased — Web availability and platform status

- Replaced unavailable platform download cards with the current web-availability message.
- Clarified that Windows is planned and that no desktop or mobile app downloads are available.
- Updated browser tool guidance and platform documentation to remove implied Windows availability.

## 0.0.43 — Optional feedback and privacy-safe reporting

- Added optional, off-by-default activity sharing with tool/platform/action metadata only.
- Added a brief rating form with an optional note; skipping submits nothing and notes are screened for obvious spam.
- Added metadata-only Vercel endpoints and a token-protected report; Redis storage remains disabled until configured in Vercel.
- Updated privacy, deployment, environment, release-readiness, and security-reporting documentation.

## 0.0.42 — Faster discovery and repeat work

- Search now matches tool examples, descriptions, and supported workflow details.
- Added local favorites, per-tool saved presets, and clearer capability notes on tool pages.
- Added public roadmap and release-note links, and described preset storage in the interface.

## 0.0.41 — Centered privacy and pricing sections

- Centered the privacy and pricing sections within the page on wide screens.
- Kept pricing cards aligned to the same centered grid.


## 0.0.40 — Readable dark tool status

- Improved ready-state contrast across workspace tool cards in dark and system themes.


## 0.0.39 — Dark file-picker button contrast

- Kept secondary file and feedback actions readable on dark surfaces.


## 0.0.38 — Consistent dark tool modules and aligned plans

- Fixed contrast and surface colors for file selection, privacy details, form labels, recovery, feedback, previews, and editor modules in dark and system themes.
- Kept pricing cards on one shared grid with matching widths and action alignment.


## 0.0.37 — Dark workspace contrast refinement

- Increased contrast on headings, form labels, recovery panels, feedback actions, and status text inside dark tool modules.

## 0.0.36 — Consistent dark theme across PRISM

- Applied the neutral dark palette across workspace navigation, tool cards, file selection, editors, previews, notices, and controls.
- Restyled search fields and focus states for readable text, caret, shortcut keys, and clear focus contrast.
- Matched marketing sections, pricing cards, settings dialogs, and the automatic system-dark theme to the same surface tokens.
- Kept the pricing cards on a shared grid width with consistent stretch and sizing.

## 0.0.35 — More readable workspace and local PDF workflows

- Added full workspace category navigation, local recent-tools history, and a working platform-appropriate Ctrl/Command+K search shortcut.
- Added a visual crop frame that can be dragged and resized, with numeric crop fields and ratio presets kept in sync.
- Expanded site-wide customization with line spacing, card style, sidebar width, page width, and focus-outline settings; increased default page text and control sizes.
- Added local QPDF WebAssembly worker workflows for lossless PDF stream optimization, known-password unlocking, AES-256 protection, and direct embedded-JPEG extraction.
- Kept password fields out of recovery storage, cleared them after processing, made PDF worker jobs cancellable, and documented each engine limit.
- Added QPDF license notices and updated the public catalog count to 150 launchable workflows. The 150 workflows have not all passed individual end-to-end fixture QA.

## 0.0.33 — Reliability, accessibility, and trust improvements

- Added a selected-file drop zone with explicit formats/caps, thumbnails/icons, file type/size, reorder/remove/clear, and additive selection.
- Added contextual privacy/safety notices, including acknowledgment gates for generated password/passphrase and QR-decoding workflows.
- Added opt-in local draft recovery through IndexedDB. A page reload interrupts computation; inputs/settings are restored for rerunning.
- Added cooperative cancellation checkpoints, larger control text, explicit input/caret colors, stronger keyboard focus, and high-contrast preference.
- Added locally saved feedback drafts with an explicit GitHub submission link.
- Expanded project, privacy, security, troubleshooting, catalog, and third-party notices documentation.

This release does not mean all catalog entries passed end-to-end QA. See `docs/tool-qa.md`.

## 0.0.34 — Workspace font fallback

- Fixed the system font fallback chain so devices without the selected typeface keep a clean sans-serif UI.

