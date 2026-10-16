# Changelog

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
