# Bloom AI Icons (`@oxy.so/bloom-ai-icons`)

> Standards: `~/AGENTS.md`, `~/Oxy/AGENTS.md`, Bloom's `AGENTS.md`. Docs: `docs/index.mdx`. Rules only.

```bash
bun install
bun run typescript && bun run test && bun run build   # build runs verify:package
bun run release                                       # release-it: bump, tag, GitHub release, npm publish
```

Companion to `@oxy.so/bloom`, kept separate so the main kit does not carry
the drawings. Peers are `react` + `react-native-svg` ONLY: colour comes in as
a prop, never from Bloom's theme — do not add `@oxy.so/bloom` as a dependency.

- **`src/icons/` is GENERATED** by `scripts/generate-icons.mjs` from
  `scripts/icon-manifest.json`. Never hand-edit it; change the script or the
  manifest and regenerate. The artwork is fetched at generation time only.
- **Never name where the artwork comes from** — not in code, component names,
  comments, docs, stories or commits. The single exception is the MIT notice
  in `NOTICE`, which the license requires. Check with a grep before committing.
- **Ids are per instance** (`useId`). A generated drawing must never emit a
  literal `id` or `url(#…)`; `logos.test.tsx` asserts every reference resolves
  inside its own drawing and that two instances never share an id.
- **Look at new marks on light AND dark.** A colour drawing made for a dark
  tile (Kimi's white letter) disappears on a light page; fix it with
  `colorFollowsTheme` in the manifest, not by editing the output.
- **The resolver tries the exact id before stripping** (`openai` must not
  become `open`). New publisher ids go in the `CATALOGUE` table in
  `resolve.test.ts`; ids that cannot normalise go in `AI_PROVIDER_ALIASES`.
- `./AiLogo*` is an export PATTERN; `verify-package.mjs` expands it against
  the tarball and requires identical names under every condition.
