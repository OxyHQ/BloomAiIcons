// Component Story Format, readable by Bloom's Storybook. Typed without a
// Storybook import so the package does not depend on it.
import { AI_PROVIDER_LOGOS } from './icons/registry';
import { AiProviderLogo, type AiProviderLogoProps } from './AiProviderLogo';

const meta = {
  title: 'AI/AiProviderLogo',
  component: AiProviderLogo,
  args: { provider: 'openai', size: 32, color: '#111', variant: 'color' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['color', 'mono'] },
  },
};
export default meta;

export const Playground = { args: {} as AiProviderLogoProps };

/** Catalogue ids as they arrive — each resolves by normalisation. */
export const CatalogueIds = {
  render: (args: AiProviderLogoProps) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {['mistralai', 'x-ai', 'meta-llama', 'ibm-granite', 'moonshotai', 'bytedance-seed', 'z-ai', 'aion-labs', 'rekaai', 'dots-studio', 'amazon', 'thinkingmachines'].map((id) => (
        <div key={id} style={{ textAlign: 'center', width: 96, fontSize: 11 }}>
          <AiProviderLogo {...args} provider={id} />
          <div>{id}</div>
        </div>
      ))}
    </div>
  ),
};

/** Every mark, colour then mono, on light and dark. */
export const AllMarks = {
  render: (args: AiProviderLogoProps) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 120px)', gap: 8 }}>
      {Object.entries(AI_PROVIDER_LOGOS).map(([key, Logo]) => (
        <div key={key} style={{ fontSize: 11 }}>
          <Logo size={args.size} color="#111" />
          <Logo size={args.size} color="#111" variant="mono" />
          <span style={{ background: '#1c1c1e', display: 'inline-block' }}>
            <Logo size={args.size} color="#f2f2f7" />
          </span>
          <div>{key}</div>
        </div>
      ))}
    </div>
  ),
};

/** No mark for the id: the initial on a square tinted with `color`. */
export const Fallback = { args: { provider: 'sao10k', color: '#6b7280' } };
