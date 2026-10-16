# PRISM browser tool QA

## Current inventory

The website lists 150 catalog entries. The availability filter starts on the 146 workflows marked ready or limited. Four PDF entries remain in development and cannot be launched from the installed workspace.

`npm run audit:tools` verifies catalog IDs and metadata, explicit runner route references, and the 146/4 availability split. It does not execute tool operations and must not be read as a 146-tool end-to-end pass.

## Verified in this pass

| Area | Result | Evidence |
| --- | --- | --- |
| Catalog integrity | Pass | `npm run audit:tools`: 150 unique IDs, 146 available, 4 in development, explicit route references present. |
| Production compilation | Pass | `npm run build`: TypeScript and Vite production build completed. |
| Whitespace / patch integrity | Pass | `git diff --check` completed without whitespace errors. |
| Calculator smoke test | Pass (previous live check) | Deployed calculator evaluated `(125 + 75) * 0.8` as `160`. |
| Browser-local image and PDF workflows | Not run end to end in this pass | Local browser preview could not connect from the browser environment. |
| Other individual tool outputs | Not run end to end in this pass | Route references and compilation do not establish correct output. |

## Known availability limits

- PDF compression (20), PDF unlocking (25), PDF protection (26), and embedded PDF image extraction (29) remain in development. Their runner paths fail closed; no placeholder file is generated.
- Image watermark tool 8 is accurately presented as a text watermark. Image-watermark placement is not implemented.
- Image crop exposes pixel dimensions, X/Y origin, and a supported ratio selector; it does not have a draggable crop canvas.
- Browser file caps are enforced by the runner. See `README.md` for current limits. Image decoding now rejects images above 40 megapixels and contact-sheet creation decodes one image at a time. Long-running progress/cancellation still needs follow-up QA.
- The barcode generator is lazy-loaded but adds a large chunk when selected (about 928 kB minified in the current build).

## Next QA gate

Before describing all 146 workflows as individually verified, run a browser-based fixture matrix covering valid output, invalid input, limits, previews, and downloads for each available ID. Record fixture and output evidence per ID. File-tool coverage must include sample PNG/JPEG/WebP, PDFs, DOCX, CSV, and ZIP files, including malformed and boundary-size cases. Keep failed or untested items out of the verified count.
