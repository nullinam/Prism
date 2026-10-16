# Tool catalog, formats, and browser trial limits

This document describes the public browser trial. A tool may impose a narrower rule than the general category rule; the live tool page is authoritative. Inputs stay in the browser for supported routes. Limits are safeguards for client memory and responsiveness, not claims that every machine can safely process the maximum.

| Tool family | Accepted formats / input | Trial caps | Notes |
| --- | --- | --- | --- |
| Images | PNG, JPG/JPEG, WebP, GIF, BMP | Up to 10 files, 20 MiB per file, 200 MiB aggregate; 40 megapixels per decoded image | Animated GIFs are decoded as a still image in canvas workflows. Re-encoding may alter color profile, transparency, or animation. |
| Images to PDF | PNG, JPG/JPEG, WebP, GIF, BMP | Up to 10 images, 20 MiB each, 100 MiB aggregate | Output is a separate PDF copy. |
| PDF | PDF | Up to 2 PDFs, 10 MiB aggregate, 100 pages | Four listed operations remain in development: compression, unlocking, protection, and image extraction. |
| Documents | TXT, CSV, JSON, XML, Markdown | Up to 2 files, 5 MiB aggregate; pasted text up to 20,000 characters | Browser conversion cannot guarantee fidelity for complex Office layouts. |
| Data | CSV, JSON, TXT where supported | Up to 2 files, 5 MiB aggregate; 5,000 rows | Validate delimiter, encoding, and schema after conversion. |
| Files | File types accepted by the named operation | Up to 10 files, 20 MiB per file, 50 MiB aggregate | ZIP extraction additionally allows at most 500 entries, 50 MiB per expanded entry, and 100 MiB total expanded data. Folder selection is not supported. Operations produce copies; the browser sandbox prevents changing original paths. |
| Calculators and simple utilities | Form inputs | 25 runs per browser session for limited categories; values vary by tool | Estimates depend on user-provided assumptions and are not professional advice. |
| Text inputs | Pasted text | Up to 20,000 characters | The per-tool page explains expected input. |

## Output and overwrite behavior

The browser trial leaves source files unchanged. It creates output blobs in page memory, shows previews where supported, and asks the user to save a copy. Browser download managers decide the destination and may rename a duplicate filename; PRISM cannot safely inspect or overwrite a user's filesystem path from a web page.

## Batch behavior

Where a tool accepts multiple files, the visible settings apply to the batch. The list can be reordered, removed from, or cleared before processing. Results use the output name shown in the tool form plus input-derived suffixes where needed. The app does not provide per-file option overrides in this trial.

## Not a verified capability

A catalog route and successful compilation only establish that the UI and handler exist. They do not prove output correctness for every input. Consult [tool QA](tool-qa.md) for verified coverage and known limitations.
