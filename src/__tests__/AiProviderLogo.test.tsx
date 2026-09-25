import type { ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { AI_PROVIDER_LOGOS, AiProviderLogo, AiProviderLogoFallback, aiProviderInitial } from '../index';

function render(el: React.ReactElement): ReactTestRenderer {
  let r!: ReactTestRenderer;
  act(() => {
    r = create(el);
  });
  return r;
}

describe('AiProviderLogo', () => {
  it('draws the resolved mark', () => {
    const r = render(<AiProviderLogo provider="mistralai" size={16} color="#333" />);
    expect(r.root.findByType(AI_PROVIDER_LOGOS.mistral).props).toMatchObject({ size: 16, color: '#333' });
    expect(r.root.findAllByType(AiProviderLogoFallback)).toHaveLength(0);
  });

  it('passes the variant through', () => {
    const r = render(<AiProviderLogo provider="google" variant="mono" color="#333" />);
    const fills = r.root
      .findAll((n) => n.type === ('Path' as never))
      .map((n) => {
        for (let a: typeof n | null = n; a; a = a.parent) if (a.props.fill) return a.props.fill;
        return undefined;
      });
    expect(new Set(fills)).toEqual(new Set(['#333']));
  });

  it('falls back to the initial on a tinted square', () => {
    const r = render(<AiProviderLogo provider="thinkingmachines" size={18} color="#222" />);
    const svg = r.root.findByType('Svg' as never);
    expect(svg.props).toMatchObject({ width: 18, height: 18 });
    expect(r.root.findByType('Rect' as never).props).toMatchObject({ fill: '#222', fillOpacity: 0.14 });
    const text = r.root.findByType('SvgText' as never);
    expect(text.props.fill).toBe('#222');
    expect(text.props.children).toBe('T');
  });

  it('fallback paints currentColor when no colour is given', () => {
    const r = render(<AiProviderLogo provider="sao10k" />);
    expect(r.root.findByType('SvgText' as never).props).toMatchObject({ fill: 'currentColor', children: 'S' });
  });

  it('initial skips punctuation and handles empty ids', () => {
    expect(aiProviderInitial('-acme')).toBe('A');
    expect(aiProviderInitial('01-ai')).toBe('0');
    expect(aiProviderInitial('')).toBe('?');
    expect(aiProviderInitial('ñandú')).toBe('Ñ');
  });

  it("fits the ModelPicker provider slot's { size, color } props", () => {
    // The slot's type, as `@oxy.so/bloom/composer-panel` declares it.
    const logo: (props: { size: number; color: string }) => ReactNode = (p) => (
      <AiProviderLogo provider="openai" {...p} />
    );
    const r = render(<>{logo({ size: 20, color: '#000' })}</>);
    expect(r.root.findByType(AI_PROVIDER_LOGOS.openai).props).toMatchObject({ size: 20, color: '#000' });
  });
});
