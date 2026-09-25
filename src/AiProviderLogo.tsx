import { Rect, Svg, Text as SvgText } from 'react-native-svg';

import { resolveLogoSize } from './create-ai-logo';
import { getAiProviderLogo } from './resolve';
import type { AiLogoProps } from './types';

export interface AiProviderLogoProps extends Omit<AiLogoProps, 'fill'> {
  /**
   * The publisher id as a model catalogue spells it — `openai`, `mistralai`,
   * `x-ai`, `meta-llama`, … — or a full model id (`openai/gpt-4o`).
   */
  provider: string;
}

/**
 * The mark for a model publisher, resolved from its catalogue id.
 *
 * Fits the ModelPicker provider slot as it stands:
 *
 * ```tsx
 * logo: (p) => <AiProviderLogo provider="openai" variant="mono" {...p} />
 * ```
 *
 * With no mark for the id it draws the id's initial on a rounded square
 * tinted with `color`, so a row of providers never has a hole in it.
 */
export function AiProviderLogo({ provider, ...props }: AiProviderLogoProps) {
  const Logo = getAiProviderLogo(provider);
  if (Logo) return <Logo {...props} />;
  return <AiProviderLogoFallback provider={provider} {...props} />;
}

/** The first letter or digit of the id, uppercased; `?` when there is none. */
export function aiProviderInitial(provider: string): string {
  const m = /[\p{L}\p{N}]/u.exec(provider.split('/')[0] ?? '');
  return m ? m[0].toUpperCase() : '?';
}

/**
 * The fallback on its own: the provider's initial on a rounded square. The
 * square is `color` at 14%, the letter `color` — both follow the paint the slot
 * hands over, so it sits in whatever theme the mark would have.
 */
export function AiProviderLogoFallback({
  provider,
  size,
  width,
  height,
  color,
  variant: _variant,
  ...rest
}: AiProviderLogoProps) {
  const px = resolveLogoSize(size, width, height);
  const paint = color ?? 'currentColor';
  return (
    <Svg {...rest} width={px} height={px} viewBox="0 0 24 24">
      <Rect x="0" y="0" width="24" height="24" rx="6" fill={paint} fillOpacity={0.14} />
      <SvgText
        x="12"
        y="16.5"
        fill={paint}
        fontSize="13"
        fontWeight="600"
        textAnchor="middle">
        {aiProviderInitial(provider)}
      </SvgText>
    </Svg>
  );
}
