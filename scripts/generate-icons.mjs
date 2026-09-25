#!/usr/bin/env node
/**
 * Regenerates `src/icons/` from the SVG artwork: one `AiLogo<Name>.tsx` per
 * entry in `icon-manifest.json`, the `index.ts` barrel and `registry.ts`.
 * Every file it writes is GENERATED — change this script or the manifest and
 * re-run it; never hand-edit the output.
 *
 *   node scripts/generate-icons.mjs --source <base-url>   # fetches <base-url>/<stem>.svg
 *   node scripts/generate-icons.mjs --dir <folder>        # reads <folder>/<stem>.svg
 *
 * Artwork is fetched at generation time only. The components are plain
 * react-native-svg trees; nothing is downloaded at runtime.
 *
 * What the conversion does to a drawing, and why:
 * - The mono drawing paints `currentColor`. Every `currentColor` becomes the
 *   component's resolved fill, so a mark follows the colour it is handed.
 * - Every `id` is rewritten to a per-instance id (`useId`). Two logos with
 *   gradients on one web page would otherwise share `url(#…)` targets, and the
 *   second silently paints with the first one's gradient.
 * - An alpha mask (`mask-type:alpha`) becomes a luminance mask with its
 *   content painted white at the same opacity. Luminance of white times alpha
 *   is alpha, so the result is identical, and it works on every
 *   react-native-svg version (the `maskType` prop only exists since 15).
 *   Left as it was, a mask drawn in black is transparent under luminance and
 *   the whole mark disappears.
 * - `<title>`, `style`, `width`/`height` and `xmlns` are dropped: the size
 *   comes from props and the accessible name from the caller.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'icons');
const manifest = JSON.parse(readFileSync(join(ROOT, 'scripts', 'icon-manifest.json'), 'utf8'));

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const source = flag('--source');
const dir = flag('--dir');
if (!source === !dir) {
  console.error('usage: generate-icons.mjs (--source <base-url> | --dir <folder>)');
  process.exit(2);
}

/** @returns {Promise<string | undefined>} the SVG text, or undefined when there is no such file. */
async function load(stem) {
  if (dir) {
    try {
      return readFileSync(join(dir, `${stem}.svg`), 'utf8');
    } catch {
      return undefined;
    }
  }
  const res = await fetch(`${source.replace(/\/$/, '')}/${stem}.svg`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`${stem}.svg: HTTP ${res.status}`);
  return res.text();
}

// ---------------------------------------------------------------- parsing

/** Tiny XML parser: the artwork is machine-written SVG with no text nodes we keep. */
function parse(svg) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const tagRe = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g;
  let m;
  while ((m = tagRe.exec(svg))) {
    const [, closing, tag, attrText, selfClosing] = m;
    if (closing) {
      const top = stack.pop();
      if (top.tag !== tag) throw new Error(`mismatched </${tag}> (open: <${top.tag}>)`);
      continue;
    }
    const attrs = {};
    for (const a of attrText.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    const node = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!selfClosing) stack.push(node);
  }
  if (stack.length !== 1) throw new Error('unclosed element');
  const svgNode = root.children.find((n) => n.tag === 'svg');
  if (!svgNode) throw new Error('no <svg> element');
  return svgNode;
}

function* walk(node) {
  yield node;
  for (const c of node.children) yield* walk(c);
}

// ------------------------------------------------------------- transforms

const SHAPES = new Set(['path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line']);

function rewriteAlphaMasks(svg) {
  const gradients = new Map();
  for (const n of walk(svg)) {
    if ((n.tag === 'linearGradient' || n.tag === 'radialGradient') && n.attrs.id) gradients.set(n.attrs.id, n);
  }
  for (const mask of walk(svg)) {
    if (mask.tag !== 'mask') continue;
    const alpha = /mask-type\s*:\s*alpha/.test(mask.attrs.style ?? '');
    delete mask.attrs.style;
    if (!alpha) continue;
    for (const n of walk(mask)) {
      if (!SHAPES.has(n.tag) && n.tag !== 'g') continue;
      const fill = n.attrs.fill;
      const ref = fill && /^url\(#(.+)\)$/.exec(fill);
      if (ref) {
        const g = gradients.get(ref[1]);
        if (!g) throw new Error(`mask references missing gradient ${ref[1]}`);
        for (const stop of g.children) if (stop.tag === 'stop') stop.attrs['stop-color'] = '#fff';
      } else if (fill !== 'none' && SHAPES.has(n.tag)) {
        n.attrs.fill = '#fff';
      }
    }
  }
}

const camel = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const ELEMENTS = {
  path: 'Path',
  g: 'G',
  defs: 'Defs',
  linearGradient: 'LinearGradient',
  radialGradient: 'RadialGradient',
  stop: 'Stop',
  mask: 'Mask',
  clipPath: 'ClipPath',
  circle: 'Circle',
  ellipse: 'Ellipse',
  rect: 'Rect',
  polygon: 'Polygon',
  polyline: 'Polyline',
  line: 'Line',
};

/**
 * Emits the drawing's children as JSX. Ids are numbered in document order;
 * `id(n)` / `url(n)` are supplied by the component at render time.
 */
function emit(svg) {
  const ids = new Map();
  for (const n of walk(svg)) if (n.attrs.id) ids.set(n.attrs.id, ids.size);
  const used = new Set();

  const value = (name, raw) => {
    if (name === 'id') {
      used.add('id');
      return `{id(${ids.get(raw)})}`;
    }
    const ref = /^url\(#(.+)\)$/.exec(raw);
    if (ref) {
      if (!ids.has(ref[1])) throw new Error(`reference to missing id ${ref[1]}`);
      used.add('url');
      return `{url(${ids.get(ref[1])})}`;
    }
    // A colour drawing may paint part of itself `currentColor` too (a black
    // wordmark beside a coloured symbol): that part follows the theme colour.
    if (raw === 'currentColor') {
      used.add('fill');
      return '{fill}';
    }
    return JSON.stringify(raw);
  };

  const lines = [];
  const render = (node, depth) => {
    const el = ELEMENTS[node.tag];
    if (node.tag === 'title') return;
    if (!el) throw new Error(`unsupported element <${node.tag}>`);
    used.add(el);
    const pad = '  '.repeat(depth);
    const attrs = Object.entries(node.attrs)
      .filter(([k]) => k !== 'style' && k !== 'xmlns')
      .map(([k, v]) => `${camel(k)}=${value(k, v)}`);
    const open = `${pad}<${el}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
    const kids = node.children.filter((c) => c.tag !== 'title');
    if (!kids.length) {
      lines.push(`${open} />`);
      return;
    }
    lines.push(`${open}>`);
    for (const c of kids) render(c, depth + 1);
    lines.push(`${pad}</${el}>`);
  };

  // Paint the root carries (the mono drawing's `fill="currentColor"`) moves
  // onto a wrapping <G>, so children inherit it exactly as they did.
  const rootPaint = Object.entries(svg.attrs).filter(([k]) =>
    ['fill', 'fill-rule', 'clip-rule', 'fill-opacity'].includes(k),
  );
  const depth = rootPaint.length ? 3 : 2;
  if (rootPaint.length) {
    used.add('G');
    lines.push(`    <G ${rootPaint.map(([k, v]) => `${camel(k)}=${value(k, v)}`).join(' ')}>`);
  }
  const kids = svg.children.filter((c) => c.tag !== 'title');
  for (const c of kids) render(c, depth);
  if (rootPaint.length) lines.push('    </G>');
  if (kids.length > 1 && !rootPaint.length) {
    lines.unshift('    <>');
    lines.push('    </>');
    for (let i = 1; i < lines.length - 1; i++) lines[i] = '  ' + lines[i];
  }
  return { jsx: lines.join('\n'), used, viewBox: svg.attrs.viewBox ?? '0 0 24 24' };
}

/** Paints listed in `colorFollowsTheme` become `currentColor` (outside masks and clips). */
function followTheme(svg, paints) {
  const wanted = new Set(paints.map((p) => p.toLowerCase()));
  const visit = (node) => {
    if (node.tag === 'mask' || node.tag === 'clipPath') return;
    if (node.attrs.fill && wanted.has(node.attrs.fill.toLowerCase())) node.attrs.fill = 'currentColor';
    node.children.forEach(visit);
  };
  visit(svg);
}

function convert(text, mono, themePaints = []) {
  const svg = parse(text);
  rewriteAlphaMasks(svg);
  if (themePaints.length) followTheme(svg, themePaints);
  const out = emit(svg);
  if (mono && !out.used.has('fill')) throw new Error('mono drawing never paints currentColor');
  return out;
}

// ----------------------------------------------------------------- output

const HEADER = '// GENERATED by scripts/generate-icons.mjs from scripts/icon-manifest.json — do not edit.';

function paintParams(used) {
  const p = ['fill', 'id', 'url'].filter((k) => used.has(k));
  return p.length ? `({ ${p.join(', ')} })` : '()';
}

function iconFile(entry, mono, color) {
  const svgImports = new Set([...mono.used, ...(color?.used ?? [])].filter((k) => /^[A-Z]/.test(k)));
  if (color && mono.viewBox !== color.viewBox) {
    throw new Error(`${entry.key}: mono and colour drawings disagree on viewBox`);
  }
  const body = [
    HEADER,
    `import { ${[...svgImports].sort().join(', ')} } from 'react-native-svg';`,
    '',
    "import { createAiLogo } from '../create-ai-logo';",
    '',
    `/** The ${entry.label} mark${color ? ' — full colour by default, `variant="mono"` for one colour' : ', drawn in one colour'}. */`,
    `export const AiLogo${entry.name} = createAiLogo({`,
    `  name: ${JSON.stringify(entry.label)},`,
    ...(mono.viewBox === '0 0 24 24' ? [] : [`  viewBox: ${JSON.stringify(mono.viewBox)},`]),
    `  mono: ${paintParams(mono.used)} => (`,
    mono.jsx,
    '  ),',
    ...(color ? [`  color: ${paintParams(color.used)} => (`, color.jsx, '  ),'] : []),
    '});',
    '',
  ];
  return body.join('\n');
}

async function main() {
  for (const f of readdirSync(OUT)) if (/^AiLogo.*\.tsx$/.test(f)) rmSync(join(OUT, f));
  mkdirSync(OUT, { recursive: true });

  const written = [];
  for (const entry of manifest.logos) {
    const monoText = await load(entry.source);
    if (!monoText) throw new Error(`${entry.key}: no artwork "${entry.source}"`);
    const colorText = await load(`${entry.source}-color`);
    const mono = convert(monoText, true);
    const color = colorText ? convert(colorText, false, entry.colorFollowsTheme) : undefined;
    writeFileSync(join(OUT, `AiLogo${entry.name}.tsx`), iconFile(entry, mono, color));
    written.push({ ...entry, hasColor: Boolean(color) });
  }

  writeFileSync(
    join(OUT, 'index.ts'),
    [HEADER, ...written.map((e) => `export { AiLogo${e.name} } from './AiLogo${e.name}';`), ''].join('\n'),
  );

  writeFileSync(
    join(OUT, 'registry.ts'),
    [
      HEADER,
      "import type { AiLogoComponent } from '../types';",
      ...written.map((e) => `import { AiLogo${e.name} } from './AiLogo${e.name}';`),
      '',
      '/** Every mark, by registry key (lowercase, no separators). */',
      'export const AI_PROVIDER_LOGOS = {',
      ...written.map((e) => `  ${e.key}: AiLogo${e.name},`),
      '} as const satisfies Record<string, AiLogoComponent>;',
      '',
      'export type AiProviderLogoKey = keyof typeof AI_PROVIDER_LOGOS;',
      '',
    ].join('\n'),
  );

  console.log(
    `[generate-icons] ${written.length} marks, ${written.filter((e) => e.hasColor).length} with a colour drawing`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
