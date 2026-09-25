import { AI_PROVIDER_LOGOS, type AiProviderLogoKey } from './icons/registry';
import type { AiLogoComponent } from './types';

/**
 * Publisher ids that do not reduce to a registry key by normalisation alone —
 * the lab publishes under a parent's or a product's mark. Keys are already
 * normalised (lowercase, no separators).
 */
export const AI_PROVIDER_ALIASES: Readonly<Record<string, AiProviderLogoKey>> = {
  amazon: 'aws',
  bedrock: 'aws',
  chatglm: 'zhipu',
  ernie: 'wenxin',
  gemma: 'google',
  granite: 'ibm',
  hf: 'huggingface',
  inclusion: 'antgroup',
  inclusionai: 'antgroup',
  ling: 'antgroup',
  llama: 'meta',
  meituan: 'longcat',
  metallama: 'meta',
  mimo: 'xiaomi',
  moonshotai: 'moonshot',
  nous: 'nousresearch',
  phi: 'microsoft',
  seed: 'bytedance',
  togethercomputer: 'together',
  xiaomimimo: 'xiaomi',
  zhipuai: 'zhipu',
};

const SUFFIXES = ['research', 'studio', 'labs', 'lab', 'ai'] as const;

function lookup(candidate: string): AiProviderLogoKey | undefined {
  if (!candidate) return undefined;
  if (Object.prototype.hasOwnProperty.call(AI_PROVIDER_LOGOS, candidate)) {
    return candidate as AiProviderLogoKey;
  }
  return Object.prototype.hasOwnProperty.call(AI_PROVIDER_ALIASES, candidate)
    ? AI_PROVIDER_ALIASES[candidate]
    : undefined;
}

function stripSuffix(id: string): string {
  for (const s of SUFFIXES) {
    if (id.length > s.length && id.endsWith(s)) return id.slice(0, -s.length);
  }
  return id;
}

/**
 * The lookups tried for a publisher id, in order. Exposed so a caller (or a
 * test) can see why an id resolved the way it did.
 *
 * `'Meta-Llama'` → `['meta-llama', 'metallama', 'meta']`
 */
export function aiProviderCandidates(provider: string): string[] {
  // `openai/gpt-4o` → `openai`: a full model id carries its publisher first.
  const id = provider.trim().toLowerCase().split('/')[0]!.replace(/[\s_.]+/g, '-');
  const joined = id.replace(/-/g, '');
  const first = id.split('-')[0] ?? '';
  const out = [id, joined, stripSuffix(joined), first, stripSuffix(first)];
  return out.filter((c, i) => c && out.indexOf(c) === i);
}

/**
 * Resolves a publisher id as model catalogues spell it (`mistralai`, `x-ai`,
 * `meta-llama`, `ibm-granite`, `z-ai`, `aion-labs`, …) to a registry key, or
 * `undefined` when there is no mark for it.
 *
 * Tries, in order: the id lowercased; without hyphens; without a trailing
 * `ai` / `lab(s)` / `research` / `studio`; its first hyphen segment; that
 * segment without the suffix. Each try checks the registry, then the aliases.
 */
export function resolveAiProvider(provider: string | null | undefined): AiProviderLogoKey | undefined {
  if (!provider) return undefined;
  for (const c of aiProviderCandidates(provider)) {
    const hit = lookup(c);
    if (hit) return hit;
  }
  return undefined;
}

/** The mark component for a publisher id, or `undefined`. */
export function getAiProviderLogo(provider: string | null | undefined): AiLogoComponent | undefined {
  const key = resolveAiProvider(provider);
  return key ? AI_PROVIDER_LOGOS[key] : undefined;
}

/** Whether `AiProviderLogo` draws a real mark for this id (rather than the initial). */
export function hasAiProviderLogo(provider: string | null | undefined): boolean {
  return resolveAiProvider(provider) !== undefined;
}
