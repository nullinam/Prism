# Tool catalog, formats, and browser trial limits

This document describes the public browser trial. A tool may impose a narrower rule than the general category rule; the live tool page is authoritative. Inputs stay in the browser for supported routes. Limits are safeguards for client memory and responsiveness, not claims that every machine can safely process the maximum.

The catalog contains 150 entries, displayed in numeric ID order from 001 to 150. “Ready to try” and “Limited” describe the current route and browser workflow; neither is a QA certification. Check [tool QA](tool-qa.md) for evidence and outstanding blockers. Search results are relevance-ranked and update locally while typing.

| Tool family | Accepted formats / input | Trial caps | Notes |
| --- | --- | --- | --- |
| Images | PNG, JPG/JPEG, WebP, GIF, BMP | Up to 10 files, 20 MiB per file, 200 MiB aggregate; 40 megapixels per decoded image | Animated GIFs are decoded as a still image in canvas workflows. Re-encoding may alter color profile, transparency, or animation. |
| Images to PDF | PNG, JPG/JPEG, WebP, GIF, BMP | Up to 10 images, 20 MiB each, 100 MiB aggregate | Output is a separate PDF copy. |
| PDF | PDF | Up to 2 PDFs, 10 MiB aggregate, 100 pages | Compression runs lossless stream optimization and only saves a smaller result. Unlocking requires a known password. Protection uses AES-256. Image extraction exports directly embedded JPEG images only. These QPDF WebAssembly operations run locally in a worker. |
| Documents | TXT, CSV, JSON, XML, Markdown | Up to 2 files, 5 MiB aggregate; pasted text up to 20,000 characters | Browser conversion cannot guarantee fidelity for complex Office layouts. |
| Data | IDs 61–65: one JSON, CSV, YAML, or XML file up to 5 MiB. IDs 66–75: typed/form values | Conversion collections cap at 5,000 rows/entries; text inputs up to 20,000 characters | Tool pages describe supported subsets and excluded advanced options. |
| Files | File types accepted by the named operation | Up to 10 files, 20 MiB per file, 50 MiB aggregate | ZIP extraction additionally allows at most 500 entries, 50 MiB per expanded entry, and 100 MiB total expanded data. Folder selection is not supported. Operations produce copies; the browser sandbox prevents changing original paths. |
| Calculators and simple utilities | Form inputs | 25 runs per browser session for limited categories; values vary by tool | Estimates depend on user-provided assumptions and are not professional advice. |
| Text inputs | Pasted text | Up to 20,000 characters | The per-tool page explains expected input. |

## Output and overwrite behavior

The browser trial leaves source files unchanged. It creates output blobs in page memory, shows previews where supported, and asks the user to save a copy. Browser download managers decide the destination and may rename a duplicate filename; PRISM cannot safely inspect or overwrite a user's filesystem path from a web page.

## Tool-specific browser trial limits

- **Read text file:** previews at most the first 20,000 characters of one selected text file. Paging, search, encoding override, and partial export are not available yet; this entry is marked **Limited** in the catalog.
- **Text tools (46–60):** all accept up to 20,000 typed characters unless stated otherwise and are marked **Limited**. Lorem generation creates 5–300 fixed-vocabulary words across 1–20 paragraphs. Slugs are lowercase with a configurable separator and maximum length; accent removal uses fixed Unicode NFD normalization. Reverse supports code points, words per line, or line order; repeat supports 1–500 repetitions and newline/space/comma separators with a 20,000-character output cap. Line numbering offers start, increment, width, and separator; trim removes both-side whitespace and preserves blank lines; join uses a custom separator and omits empty lines. Split is by exact character count and creates a ZIP of numbered TXT parts. Find counts literal matches and shows at most 100 positions. Email and URL extraction use simple patterns; URL extraction supports HTTP/HTTPS only. Hashtags are counted without case folding. Base64 tools accept UTF-8 text and support URL-safe encoding/decoding; binary input/output and alternate charsets are not supported. See the catalog cards and QA matrix for exact current behavior and outstanding output-save verification.

## Data tools (61–75)

All Data tools are marked **Limited** to reflect their implemented browser workflows. JSON-to-CSV accepts arrays of objects; CSV-to-JSON expects one header row, unique non-empty headers, comma delimiters, correctly balanced quotes, and matching row widths. JSON-to-YAML and YAML-to-JSON support the subsets described on their tool cards; YAML-to-JSON accepts JSON-compatible YAML or simple flat key/value lines and rejects nested YAML. XML-to-JSON preserves repeated elements, attributes, and element text but does not offer namespace or mapping controls. URL encoding uses component encoding; URL decoding treats plus as space and reports malformed escapes. HTML entity conversion handles the characters listed on the tool cards. Timestamp conversion reports UTC and local values; date difference and add-days use calendar-day arithmetic; number base conversion supports positive integers; average and percentage tools provide their listed basic statistics/formulas. These tools do not provide the advanced controls in the original feature concepts.

## Calculator tools (91–105)

Calculator tools are estimates based only on the values shown in their forms and do not provide financial, legal, tax, or medical advice. All calculators enforce required numeric inputs and return visible errors for invalid values. Basic/scientific calculators support the operators and functions described on their cards, not general trigonometry or logarithms. Percent, tip, bill split, discount, tax, loan, compound/simple interest, and savings tools implement only their displayed formulas and assumptions; advanced schedules and scenarios are not included. Date calculator uses UTC calendar-day arithmetic. Age calculation reports completed years. Time duration handles one interval across midnight and one break. Unit conversion only allows matching length, mass, or volume groups and explicit Fahrenheit/Celsius pairs.

## File tools (76–90)

File operations run locally on selected files and never modify their original paths. Rename, prefix, suffix, and extension tools produce renamed copies inside a ZIP; changing an extension does not convert the file format. Name sorting uses natural ordering and stores files in that order in a ZIP. Size and date sorting, duplicate search, size comparison, hashing, and file information produce text results. Splitting downloads individual numbered chunks; joining concatenates at least two parts in numeric filename order to a .bin file without checking a manifest or missing part sequence. ZIP creation stores a flat set of filenames. ZIP extraction accepts one archive, returns matching entries as separate downloads, and flattens output paths to filenames. It caps entries and expanded size as shown above. Folder preservation, destination selection, conflict review, and integrity manifests are not available.

## Batch behavior

Where a tool accepts multiple files, the visible settings apply to the batch. The list can be reordered, removed from, or cleared before processing. Results use the output name shown in the tool form plus input-derived suffixes where needed. The app does not provide per-file option overrides in this trial.

## Not a verified capability

A catalog route and successful compilation only establish that the UI and handler exist. They do not prove output correctness for every input. Consult [tool QA](tool-qa.md) for verified coverage and known limitations.

