import { copyFileSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs');
const dest = path.join(root, 'public/pdf.worker.min.js');
const versionFile = path.join(root, 'src/pdf-worker-version.json');

if (!existsSync(src)) {
  console.error('[copy-pdf-worker] No se encontró el worker de pdfjs-dist en node_modules:', src);
  process.exit(1);
}

copyFileSync(src, dest);

const pkg = JSON.parse(readFileSync(path.join(root, 'node_modules/pdfjs-dist/package.json'), 'utf8'));
const version = pkg.version;

const srcDir = path.join(root, 'src');
if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
writeFileSync(versionFile, JSON.stringify({ version }, null, 2) + '\n');

console.log(`[copy-pdf-worker] Worker PDF copiado (v${version}) -> public/pdf.worker.min.js`);
