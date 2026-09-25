# @oxy.so/bloom-ai-icons

AI model-publisher marks for [Bloom](https://github.com/OxyHQ/Bloom) — React
Native + Web, on `react-native-svg` — and `AiProviderLogo`, which turns a
catalogue publisher id (`openai`, `mistralai`, `x-ai`, `meta-llama`,
`ibm-granite`, …) into the right mark, or a clean initial when there is none.

```bash
bun add @oxy.so/bloom-ai-icons
```

```tsx
import { AiProviderLogo, hasAiProviderLogo } from '@oxy.so/bloom-ai-icons';
import { AiLogoAnthropic } from '@oxy.so/bloom-ai-icons/AiLogoAnthropic';

<AiProviderLogo provider="mistralai" size={20} color={colors.text} />

// Bloom's ModelPicker provider slot
logo: (p) => <AiProviderLogo provider="openai" variant="mono" {...p} />
```

Peers: `react`, `react-native-svg`. Docs: [`docs/index.mdx`](docs/index.mdx).

Breathe License 1.0 (`LICENSE`); third-party notices in `NOTICE`. Logos are
trademarks of their respective owners, included to identify each provider.
