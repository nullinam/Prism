import createQpdf from "@neslinesli93/qpdf-wasm";
import qpdfWasmUrl from "@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url";

type Job = { id: number; input: ArrayBuffer; operation: "compress" | "unlock" | "protect" | "extract-images"; password?: string; confirmPassword?: string; quality?: "lossless" | "small" };
type QpdfRuntime = { callMain: (args: string[]) => number; FS: { writeFile: (path: string, data: Uint8Array) => void; readFile: (path: string) => Uint8Array; unlink: (path: string) => void } };
const workerScope = self as unknown as { onmessage: ((event: MessageEvent<Job>) => void) | null; postMessage: (message: unknown, transfer?: Transferable[]) => void; location: Location };

workerScope.onmessage = async (event: MessageEvent<Job>) => {
  const job = event.data;
  const log: string[] = [];
  let qpdf: QpdfRuntime | null = null;
  try {
    if ((job.operation === "unlock" || job.operation === "protect") && !job.password) throw new Error("Enter a password to continue.");
    if (job.operation === "protect" && job.password !== job.confirmPassword) throw new Error("The passwords do not match.");
    qpdf = await createQpdf({ locateFile: () => new URL(qpdfWasmUrl, workerScope.location.href).href, noInitialRun: true, print: (line: string) => log.push(line), printErr: (line: string) => log.push(line) } as Parameters<typeof createQpdf>[0] & Record<string, unknown>) as unknown as QpdfRuntime;
    const inputPath = "/prism-input.pdf";
    const outputPath = "/prism-output.pdf";
    qpdf.FS.writeFile(inputPath, new Uint8Array(job.input));

    if (job.operation === "extract-images") {
      const prefix = "/prism-image";
      const jsonPath = "/prism-info.json";
      const code = qpdf.callMain(["--json", "--json-stream-data=file", `--json-stream-prefix=${prefix}`, "--decode-level=none", inputPath, jsonPath]);
      if (code !== 0) throw new Error("QPDF could not inspect this PDF. It may be damaged or unsupported.");
      const parsed = JSON.parse(new TextDecoder().decode(qpdf.FS.readFile(jsonPath))) as { qpdf?: Array<{ [key: string]: unknown }> };
      const objects = parsed.qpdf?.[1] ?? {};
      const results: Array<{ name: string; mime: string; data: ArrayBuffer; width: number; height: number }> = [];
      for (const [reference, raw] of Object.entries(objects)) {
        const stream = (raw as { stream?: { dict?: Record<string, unknown>; datafile?: string } }).stream;
        const dict = stream?.dict;
        const filters = Array.isArray(dict?.["/Filter"]) ? dict?.["/Filter"] as unknown[] : [dict?.["/Filter"]];
        if (dict?.["/Subtype"] !== "/Image" || !filters.includes("/DCTDecode") || filters.length !== 1 || !stream?.datafile) continue;
        const encoded = qpdf.FS.readFile(stream.datafile);
        const width = Number(dict["/Width"] ?? 0), height = Number(dict["/Height"] ?? 0);
        if (!width || !height || encoded.byteLength > 20 * 1024 * 1024) continue;
        const objectNumber = reference.match(/obj:(\d+)/)?.[1] ?? String(results.length + 1);
        results.push({ name: `image-${String(results.length + 1).padStart(2, "0")}-object-${objectNumber}.jpg`, mime: "image/jpeg", data: encoded.slice().buffer, width, height });
      }
      if (!results.length) throw new Error("No directly embedded JPEG images were found. This trial extracts JPEG image objects only; other PDF image encodings are not exported yet.");
      workerScope.postMessage({ id: job.id, ok: true, files: results }, results.map(item => item.data));
      return;
    }

    let args: string[];
    if (job.operation === "compress") {
      args = ["--object-streams=generate", "--recompress-flate", `--compression-level=${job.quality === "small" ? 9 : 6}`, inputPath, outputPath];
    } else if (job.operation === "unlock") {
      args = [`--password=${job.password}`, "--decrypt", inputPath, outputPath];
    } else {
      args = ["--encrypt", job.password!, job.password!, "256", "--", inputPath, outputPath];
    }
    const code = qpdf.callMain(args);
    if (code !== 0) {
      if (job.operation === "unlock") throw new Error("That password did not unlock this PDF, or the PDF uses unsupported encryption.");
      throw new Error("QPDF could not complete this operation. Check the PDF and try again.");
    }
    const bytes = qpdf.FS.readFile(outputPath).slice().buffer;
    workerScope.postMessage({ id: job.id, ok: true, data: bytes }, [bytes]);
  } catch (error) {
    workerScope.postMessage({ id: job.id, ok: false, error: error instanceof Error ? error.message : "The local PDF engine could not complete this job." });
  } finally {
    qpdf = null;
  }
};

