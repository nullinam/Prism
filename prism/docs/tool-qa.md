# PRISM browser tool QA

## Current inventory

The website lists 150 launchable workflows. “Available” means a route is implemented and can be opened; it does not mean every format, device, or edge case has passed an end-to-end fixture. The four PDF tools that were previously disabled now have local QPDF-backed routes with restricted behavior described below.

`npm run audit:tools` checks catalog IDs, metadata, route references, and the 150/0 availability count. It does not execute tools or verify output correctness.

## Verification performed for this release

Catalog, build, dependency, and QPDF engine checks passed as recorded below. A successful compile or catalog audit is not behavioral evidence for all tools.

| Area | Result | Evidence |
| --- | --- | --- |
| Catalog integrity | Pass | `npm run audit:tools`: 150 unique IDs, 150 available, 0 in development; route references are present. |
| Production compilation | Pass | `npm run build`: TypeScript and Vite production build completed. QPDF worker and 1.3 MiB WebAssembly asset are emitted. The existing barcode chunk warning remains. |
| Dependency security audit | Pass | `npm audit --omit=dev`: zero reported vulnerabilities. |
| QPDF engine smoke fixtures | Pass (Node harness) | Created a one-page PDF containing an embedded JPEG. QPDF compressed to a valid but larger copy (which PRISM correctly withholds), generated AES-256 protection, decrypted with the correct password, rejected a wrong password (exit code 2), and extracted embedded JPEG bytes from QPDF JSON. This checks engine calls, not the browser Worker UI. |
| PDF browser Worker integration | Build pass; live browser check pending | TypeScript/Vite bundle the Worker and local WASM URL. Verify interaction in the deployed site before release. |
| Visual crop interaction | Pending | Browser pointer and numeric-control verification |
| Full 150-tool output matrix | Not yet run | Requires individual inputs and output assertions for every tool ID. |

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
