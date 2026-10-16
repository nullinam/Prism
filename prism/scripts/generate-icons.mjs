import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src-tauri/icons");
await mkdir(root, { recursive: true });

function insideRoundedSquare(x, y, size) {
  const radius = size * 0.22;
  const cx = Math.max(radius, Math.min(size - radius, x));
  const cy = Math.max(radius, Math.min(size - radius, y));
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function segmentDistance(x, y, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function makePng(size) {
  const scale = 3;
  const high = size * scale;
  const colors = {
    bg: [24, 33, 30, 255],
    green: [199, 243, 106, 255],
    blue: [167, 199, 255, 255],
    peach: [255, 198, 151, 255],
    edge: [224, 250, 182, 255],
  };
  const lines = [
    { a: [95, 50], b: [180, 128], color: colors.edge },
    { a: [180, 128], b: [95, 206], color: colors.edge },
    { a: [95, 206], b: [95, 50], color: colors.edge },
    { a: [28, 128], b: [95, 128], color: colors.green },
    { a: [180, 128], b: [231, 77], color: colors.blue },
    { a: [180, 128], b: [239, 128], color: colors.green },
    { a: [180, 128], b: [231, 179], color: colors.peach },
  ].map((line) => ({ ...line, a: line.a.map((n) => (n / 256) * high), b: line.b.map((n) => (n / 256) * high) }));
  const stroke = (high / 256) * 9;
  const highPixels = Buffer.alloc(high * high * 4);
  for (let y = 0; y < high; y++) {
    for (let x = 0; x < high; x++) {
      const offset = (y * high + x) * 4;
      if (insideRoundedSquare((x + 0.5) / high * 256, (y + 0.5) / high * 256, 256)) {
        highPixels.set(colors.bg, offset);
        for (const line of lines) {
          if (segmentDistance(x + 0.5, y + 0.5, ...line.a, ...line.b) <= stroke / 2) highPixels.set(line.color, offset);
        }
      }
    }
  }
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const target = (y * size + x) * 4;
      let sums = [0, 0, 0, 0];
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        const source = (((y * scale + sy) * high) + x * scale + sx) * 4;
        for (let channel = 0; channel < 4; channel++) sums[channel] += highPixels[source + channel];
      }
      rgba.set(sums.map((sum) => Math.round(sum / (scale * scale))), target);
    }
  }
  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) rgba.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]);
}

function makeIco(frames) {
  const header = Buffer.alloc(6 + 16 * frames.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = size === 256 ? 0 : size;
    header[entry + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...frames.map(({ png }) => png)]);
}

const icon32 = makePng(32);
const icon128 = makePng(128);
const icon256 = makePng(256);
const iconFrames = await Promise.all([16, 24, 32, 48, 64, 128, 256].map(async (size) => ({ size, png: makePng(size) })));
await Promise.all([
  writeFile(path.join(root, "32x32.png"), icon32),
  writeFile(path.join(root, "128x128.png"), icon128),
  writeFile(path.join(root, "128x128@2x.png"), icon256),
  writeFile(path.join(root, "icon.png"), icon256),
  writeFile(path.join(root, "icon.ico"), makeIco(iconFrames)),
  ...[30, 44, 71, 89, 107, 142, 150, 284, 310].map((size) => writeFile(path.join(root, `Square${size}x${size}.png`), makePng(size))),
  writeFile(path.join(root, "StoreLogo.png"), makePng(50)),
]);
