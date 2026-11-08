// Fails when a color literal appears in src/ outside src/styles/tokens.css (DESIGN.md §5, §11).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const ALLOW = new Set(['src/styles/tokens.css', 'src/styles/fonts.css']);
const COLOR = /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b|\b(?:rgba?|hsla?|oklch|oklab)\(/gi;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(css|astro|ts|tsx|mjs)$/.test(name) && !full.includes('/content/')) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (ALLOW.has(rel)) continue;
  const text = readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    if (line.includes('--shiki')) return; // Shiki variables are the documented exception
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) return; // comments
    const m = line.match(COLOR);
    if (m) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
  });
}

if (offenders.length) {
  console.error('Color literals outside tokens.css:\n' + offenders.join('\n'));
  process.exit(1);
}
console.log('check-tokens: ok');
