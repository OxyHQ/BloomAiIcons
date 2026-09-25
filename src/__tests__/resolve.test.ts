import {
  AI_PROVIDER_ALIASES,
  AI_PROVIDER_LOGOS,
  aiProviderCandidates,
  hasAiProviderLogo,
  resolveAiProvider,
} from '../index';

/** Publisher ids as model catalogues spell them, and the mark each must reach. */
const CATALOGUE: Array<[string, string]> = [
  ['openai', 'openai'],
  ['anthropic', 'anthropic'],
  ['google', 'google'],
  ['qwen', 'qwen'],
  ['deepseek', 'deepseek'],
  ['deepseek-ai', 'deepseek'],
  ['mistralai', 'mistral'],
  ['mistral', 'mistral'],
  ['x-ai', 'xai'],
  ['xai', 'xai'],
  ['meta', 'meta'],
  ['meta-llama', 'meta'],
  ['nvidia', 'nvidia'],
  ['minimax', 'minimax'],
  ['moonshotai', 'moonshot'],
  ['kimi', 'kimi'],
  ['z-ai', 'zai'],
  ['bytedance-seed', 'bytedance'],
  ['bytedance', 'bytedance'],
  ['cohere', 'cohere'],
  ['amazon', 'aws'],
  ['ibm-granite', 'ibm'],
  ['microsoft', 'microsoft'],
  ['perplexity', 'perplexity'],
  ['ai21', 'ai21'],
  ['inception', 'inception'],
  ['liquid', 'liquid'],
  ['poolside', 'poolside'],
  ['rekaai', 'reka'],
  ['relace', 'relace'],
  ['sakana', 'sakana'],
  ['stepfun', 'stepfun'],
  ['stepfun-ai', 'stepfun'],
  ['tencent', 'tencent'],
  ['upstage', 'upstage'],
  ['arcee-ai', 'arcee'],
  ['aion-labs', 'aionlabs'],
  ['kwaipilot', 'kwaipilot'],
  ['dots-studio', 'dotsstudio'],
  ['xiaomi', 'xiaomi'],
  ['meituan', 'longcat'],
  ['inclusionai', 'antgroup'],
  ['nousresearch', 'nousresearch'],
  ['baidu', 'baidu'],
  ['alibaba', 'alibaba'],
  ['huggingface', 'huggingface'],
  ['together', 'together'],
];

describe('resolveAiProvider', () => {
  it.each(CATALOGUE)('%s → %s', (id, key) => {
    expect(resolveAiProvider(id)).toBe(key);
    expect(hasAiProviderLogo(id)).toBe(true);
  });

  it('ignores case, surrounding space, separators and a model suffix', () => {
    expect(resolveAiProvider('  OpenAI ')).toBe('openai');
    expect(resolveAiProvider('Meta_Llama')).toBe('meta');
    expect(resolveAiProvider('Aion Labs')).toBe('aionlabs');
    expect(resolveAiProvider('openai/gpt-4o')).toBe('openai');
    expect(resolveAiProvider('x-ai/grok-4')).toBe('xai');
  });

  it('prefers an exact key over a stripped one', () => {
    // `openai` minus `ai` is `open`; the exact key has to win first.
    expect(aiProviderCandidates('openai')[0]).toBe('openai');
    expect(resolveAiProvider('xai')).toBe('xai');
  });

  it('lists the lookups it tries, in order and without repeats', () => {
    expect(aiProviderCandidates('Meta-Llama')).toEqual(['meta-llama', 'metallama', 'meta']);
    expect(aiProviderCandidates('arcee-ai')).toEqual(['arcee-ai', 'arceeai', 'arcee']);
    expect(aiProviderCandidates('mistralai')).toEqual(['mistralai', 'mistral']);
  });

  it.each(['thinkingmachines', 'sao10k', 'someone-new', ''])('%p has no mark', (id) => {
    expect(resolveAiProvider(id)).toBeUndefined();
    expect(hasAiProviderLogo(id)).toBe(false);
  });

  it('tolerates null and undefined', () => {
    expect(resolveAiProvider(null)).toBeUndefined();
    expect(hasAiProviderLogo(undefined)).toBe(false);
  });

  it('does not treat inherited object keys as marks', () => {
    expect(resolveAiProvider('constructor')).toBeUndefined();
    expect(resolveAiProvider('__proto__')).toBeUndefined();
  });

  it('points every alias at a real mark, and no alias shadows a key', () => {
    for (const [alias, key] of Object.entries(AI_PROVIDER_ALIASES)) {
      expect(AI_PROVIDER_LOGOS).toHaveProperty(key);
      expect(Object.keys(AI_PROVIDER_LOGOS)).not.toContain(alias);
    }
  });

  it('keys are already normalised, so each resolves to itself', () => {
    for (const key of Object.keys(AI_PROVIDER_LOGOS)) {
      expect(key).toMatch(/^[a-z0-9]+$/);
      expect(resolveAiProvider(key)).toBe(key);
    }
  });
});
