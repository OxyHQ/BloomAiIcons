#!/usr/bin/env node
/**
 * Every `exports` target must be IN the packed tarball — a React Native
 * consumer has no fallback when one is missing. A pattern (`./AiLogo*`) is
 * expanded against the tarball, and every condition must expand to the SAME
 * set of names, or a mark would resolve under Metro and not under a bundler.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' }),
);
const files = new Set(packed.files.map((f) => f.path));
const errors = [];

const targets = (node, path = []) =>
  typeof node === 'string'
    ? [[path.join(' > '), node]]
    : Object.entries(node).flatMap(([k, v]) => targets(v, [...path, k]));

for (const [subpath, spec] of Object.entries(pkg.exports)) {
  const expansions = new Map();
  for (const [cond, target] of targets(spec)) {
    const rel = target.replace(/^\.\//, '');
    if (!rel.includes('*')) {
      if (!files.has(rel)) errors.push(`${subpath} [${cond}] → ${target} is not in the tarball`);
      continue;
    }
    const [pre, post] = rel.split('*');
    const names = [...files]
      .filter((f) => f.startsWith(pre) && f.endsWith(post))
      .map((f) => f.slice(pre.length, f.length - post.length))
      .sort();
    if (names.length === 0) errors.push(`${subpath} [${cond}] → ${target} matches nothing`);
    expansions.set(cond, names.join(','));
  }
  if (new Set(expansions.values()).size > 1) {
    errors.push(`${subpath}: conditions expand to different names:\n  ${[...expansions].map(([c, n]) => `${c}: ${n.split(',').length}`).join('\n  ')}`);
  }
}
for (const f of [pkg.main, pkg.module, pkg.types, pkg['react-native'], 'NOTICE', 'LICENSE']) {
  if (!files.has(f.replace(/^\.\//, ''))) errors.push(`${f} is not in the tarball`);
}
for (const f of files) {
  if (/__tests__|__mocks__|\.stories\.|\.test\./.test(f)) errors.push(`${f} should not ship`);
}

if (errors.length) {
  console.error(`[verify-package] ${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[verify-package] ${files.size} files; every export target ships.`);
