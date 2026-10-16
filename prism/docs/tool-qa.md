# PRISM browser tool QA

## Current inventory

The website lists 150 launchable workflows. “Available” means a route is implemented and can be opened; it does not mean every format, device, or edge case has passed an end-to-end fixture. The four PDF tools that were previously disabled now have local QPDF-backed routes with restricted behavior described below.

`npm run audit:tools` checks catalog IDs, metadata, route references, and the 150/0 availability count. It does not execute tools or verify output correctness.

## Current worktree verification (2026-10-17)

The uncommitted worktree changes add A–Z ordering, local sentence-based intent search, HTML input acceptance for the HTML-to-Markdown tool, a corrected URL-encode route, and explicit time validation for the Time Duration and Work Hours Calculator tools. On 2026-10-17, `npm run test:search`, `npm run build`, and `npm run audit:tools` passed after these edits. The search assertions cover 150-entry alphabetical ordering and three plain-language queries.

### Public browser workflow checks (2026-10-17)

Target: `https://prism-khaki-one.vercel.app/` (public production URL used as the staging target). Inputs were synthetic; no user files or feedback were submitted.

| Workflow | Input | Observed result | Coverage |
| --- | --- | --- | --- |
| Crop image | Synthetic 1×1 PNG | File appeared in the selected-file list and crop editor; processing produced a 1-image preview and save card. | Processing and preview verified; download-to-disk not checked. |
| Text to Base64 | `PRISM workflow check` | Preview contained `UFJJU00gd29ya2Zsb3cgY2hlY2s=`. | Processing and preview verified. |
| Basic calculator | `2 + 2` | Preview returned `2 + 2 = 4`. | Processing and preview verified. |
| Unit converter | `10`, `km` → `mi` | Preview returned `6.21 mi`. | Processing and preview verified. |
| Work hours calculator | 09:00–17:00, 30-minute break, rate 20 | Preview returned 7 h 30 m, 7.50 hours, and estimated pay 150.00. | Processing and preview verified. |

An exploratory generic-input sweep opened tools in Text, Data, Calculators, Study, Work, and Utilities. It was not a correctness pass: generic values do not satisfy every tool's input contract, and some runs showed empty results or invalid values. Do not count these exploratory attempts as passed tools. A malformed time value produced `NaN` in the public 0.0.43 build; the local source now validates the clock format and reports an actionable error, but that fix is not deployed or browser-verified yet.

The public catalog still needs individual, tool-specific fixtures for every tool. In particular, image tools beyond Crop Image, all PDF workflows, document/file workflows, QR reading, output download/reopen, batch behavior, limit boundaries, cancellation, and network-request inspection remain unverified. The full 150-tool end-to-end matrix is incomplete; route availability must not be reported as QA completion.

The per-tool tracker is [tool-qa-matrix.csv](tool-qa-matrix.csv): 5 tools have processing/preview evidence, but none has a verified save-to-disk result. The remaining 145 tools have no valid tool-specific end-to-end assertion recorded.

## Previously recorded verification (0.0.42 baseline; not rerun for 0.0.43)

The checks below were recorded for the earlier baseline. They have not been rerun against the current release candidate, including the new feedback/activity functions and UI. A successful compile or catalog audit is not behavioral evidence for all tools.

| Area | Result | Evidence |
| --- | --- | --- |
| Catalog integrity | Pass | `npm run audit:tools`: 150 unique IDs, 150 available, 0 in development; route references are present. |
| Production compilation | Pass | `npm run build`: TypeScript and Vite production build completed. QPDF worker and 1.3 MiB WebAssembly asset are emitted. The existing barcode chunk warning remains. |
| Dependency security audit | Pass | `npm audit --omit=dev`: zero reported vulnerabilities. |
| QPDF engine smoke fixtures | Pass (Node harness) | Created a one-page PDF containing an embedded JPEG. QPDF compressed to a valid but larger copy (which PRISM correctly withholds), generated AES-256 protection, decrypted with the correct password, rejected a wrong password (exit code 2), and extracted embedded JPEG bytes from QPDF JSON. This checks engine calls, not the browser Worker UI. |
| PDF browser Worker integration | Build pass; live browser check pending | TypeScript/Vite bundle the Worker and local WASM URL. Verify interaction in the deployed site before release. |
| Visual crop interaction | Pending | Browser pointer and numeric-control verification |
| Full 150-tool output matrix | Not yet run | Requires individual inputs and output assertions for every tool ID. |
| Feedback/activity API integration | Not verified for 0.0.43 | Confirm Upstash configuration, successful storage, unavailable-storage errors, spam rejection, rate limits, and the private admin token after deployment. |

## PDF engine behavior and limits

- **Compress PDF (20):** QPDF recompresses eligible streams and generates object streams without rasterizing pages or recompressing embedded JPEG photographs. PRISM compares the result to the input and only offers an output when it is smaller. A file that cannot be reduced produces an explanation and no replacement file.
- **Unlock PDF (25):** requires a password the user already knows and uses QPDF to decrypt standard PDF encryption. It does not guess passwords. The tool creates a separate output copy and applies one password to each selected PDF.
- **Protect PDF (26):** creates a separate PDF encrypted with AES-256. The user confirms the password; the trial does not expose granular printing/copying/edit permissions or separate owner passwords.
- **Extract PDF images (29):** exports directly embedded JPEG image streams using a direct DCT filter. It does not export other codecs, inline images, page text, or vector artwork. Output image names include object identifiers where available.
- These operations run in a browser Web Worker. The QPDF WebAssembly asset is served from the same PRISM origin and selected PDF bytes are staged in worker memory; no PRISM processing endpoint receives them. Worker termination supports cancellation.
- PDF passwords are not written to task-recovery storage and are cleared from the form when processing finishes. Users should still avoid entering passwords on a shared or untrusted device.

## Other known limits

- Image crop has a visible move/resize frame, with pixel width, height, X/Y, and ratio fields. The browser still decodes images in memory and limits each image to 40 megapixels.
- Image watermark tool 8 is a text watermark; image-based watermark placement is not implemented.
- Browser file caps, batch count, accepted formats, and trial limits are documented in [the catalog](tool-catalog.md) and shown on tool pages. Batch settings apply to every selected file in a job.
- Browser task recovery stores selected inputs and settings locally when enabled. Reload stops JavaScript processing; the browser restores the task draft for a new run. It cannot continue CPU work while the page is unloaded.
- Cancellation is cooperative for synchronous browser operations, while the QPDF worker can be terminated. Browser-native image decode and some canvas calls cannot be interrupted mid-call.
- The barcode generator is lazy-loaded but adds a large chunk when selected. See the latest build output before release.

## Next QA gate

Run a browser fixture matrix for each available tool ID: normal input, invalid input, trial-limit boundary, preview, saved output, and output correctness. Include large/corrupt files, unusual filenames, multi-file batches, and cancellation. For PDF tools, test unencrypted and encrypted PDFs, correct and wrong passwords, file-size comparisons, JPEG and non-JPEG image objects, and output re-open tests. Record fixture names and outcomes here. Keep “verified” counts separate from route availability.

