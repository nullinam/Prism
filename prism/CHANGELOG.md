# Changelog

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
