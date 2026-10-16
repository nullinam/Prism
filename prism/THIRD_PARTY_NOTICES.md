# Third-party notices

PRISM's first-party source is distributed under the MIT License. Dependencies are maintained by their respective authors and retain their own terms. This file is a navigation aid, not a replacement for each package's license or notice.

The runtime/build dependency set is recorded in `package.json` and `package-lock.json`, including React, Vite, TypeScript, Tauri packages, pdf-lib, pdfjs-dist, jszip, qrcode, bwip-js, ZXing browser bindings, and `@neslinesli93/qpdf-wasm` 0.3.0. The qpdf-wasm package is listed as ISC; its bundled QPDF WebAssembly engine is under Apache-2.0. A copy of the QPDF license is included in [`THIRD_PARTY_LICENSES/QPDF-LICENSE.txt`](THIRD_PARTY_LICENSES/QPDF-LICENSE.txt). Vite bundles the QPDF WebAssembly asset from the locked npm dependency into the build output; it is not loaded from a CDN.

The two expression-calculator tools use a small first-party arithmetic parser instead of evaluating user input as code. Before shipping installers or additional vendored assets, generate and review a complete dependency license inventory for the exact lockfile, preserve upstream notices, and check compatibility with the distribution model. The current static Vercel build does not bundle operating-system installers.

