#!/usr/bin/env node
// Fails when traefik-gitops routes a prod hostname that the landing page neither
// lists (src/app/services.config.ts) nor explicitly ignores
// (scripts/service-coverage.ignore). traefik-gitops services.yml is the source of
// truth because the CMDB is incomplete.
//
// usage: node scripts/check-service-coverage.mjs <path-to-services.yml>
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const routesFile = process.argv[2];
if (!routesFile) {
  console.error('usage: check-service-coverage.mjs <services.yml>');
  process.exit(2);
}

// Prod hostnames only: dev/qa are Tailscale-only and never landing-page surfaces.
const routed = new Set(
  [...readFileSync(routesFile, 'utf8').matchAll(/Host\(`([^`]+)`\)/g)]
    .map(m => m[1].toLowerCase())
    .filter(h => !/-(dev|qa)\./.test(h) && !/^(dev|qa)\./.test(h)),
);

const listed = new Set(
  [...readFileSync(join(root, 'src/app/services.config.ts'), 'utf8').matchAll(/url:\s*'https?:\/\/([^/']+)/g)]
    .map(m => m[1].toLowerCase()),
);

const ignored = new Map();
for (const raw of readFileSync(join(root, 'scripts/service-coverage.ignore'), 'utf8').split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [host, ...why] = line.split(/\s+#\s*/);
  if (!why.length) {
    console.error(`ignore entry needs a "# reason": ${line}`);
    process.exit(2);
  }
  ignored.set(host.trim().toLowerCase(), why.join(' # '));
}

const missing = [...routed].filter(h => !listed.has(h) && !ignored.has(h)).sort();
const stale = [...ignored.keys()].filter(h => listed.has(h) || !routed.has(h)).sort();

for (const h of stale) console.warn(`::warning::ignore entry no longer needed: ${h}`);

if (missing.length) {
  console.error('Prod hostnames routed in traefik-gitops but not on the landing page:');
  for (const h of missing) console.error(`  - ${h}`);
  console.error('\nAdd a tile in src/app/services.config.ts, or add the host to');
  console.error('scripts/service-coverage.ignore with a "# reason".');
  process.exit(1);
}
console.log(`ok: ${routed.size} routed prod hostnames, ${listed.size} listed, ${ignored.size} ignored`);
