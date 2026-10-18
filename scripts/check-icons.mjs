#!/usr/bin/env node
// Fails when inventory.data.ts references an icon with no file in public/icons/,
// or when a vendored icon is never referenced (dead weight).
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/app/topology/inventory.data.ts'), 'utf8');

const used = new Set([...src.matchAll(/icon:\s*'([a-z0-9-]+)'/g)].map(m => m[1]));
for (const m of src.matchAll(/icons:[^\n]*/g)) {
  for (const k of m[0].matchAll(/'([a-z0-9-]+)'/g)) used.add(k[1]);
}

const files = new Set(readdirSync(join(root, 'public/icons')).filter(f => /\.(svg|png)$/.test(f)).map(f => f.replace(/\.(svg|png)$/, '')));

const missing = [...used].filter(k => !files.has(k)).sort();
const unused = [...files].filter(k => !used.has(k)).sort();

if (unused.length) console.warn(`::warning::unused icons in public/icons: ${unused.join(', ')}`);
if (missing.length) {
  console.error(`Icons referenced in inventory.data.ts but missing from public/icons/: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`ok: ${used.size} icons referenced, ${files.size} vendored`);
