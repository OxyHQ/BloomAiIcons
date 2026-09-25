import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

import { AI_PROVIDER_LOGOS, type AiLogoComponent, type AiLogoProps } from '../index';

function render(el: React.ReactElement): ReactTestRenderer {
  let r!: ReactTestRenderer;
  act(() => {
    r = create(el);
  });
  return r;
}

function nodes(r: ReactTestRenderer): ReactTestInstance[] {
  return r.root.findAll((n) => typeof n.type === 'string');
}

const within = (n: ReactTestInstance, test: (a: ReactTestInstance) => boolean): boolean => {
  for (let p = n.parent; p; p = p.parent) if (test(p)) return true;
  return false;
};
const isCoverage = (n: ReactTestInstance) => n.type === ('Mask' as never) || n.type === ('ClipPath' as never);

/**
 * Elements that paint COLOUR. A Mask or ClipPath, and a gradient only a mask
 * uses, paint coverage — white there means "visible", not white.
 */
function paints(r: ReactTestRenderer): ReactTestInstance[] {
  const coverageRefs = new Set(
    nodes(r)
      .filter((n) => within(n, isCoverage))
      .map((n) => /^url\(#(.+)\)$/.exec(String(n.props.fill))?.[1])
      .filter(Boolean),
  );
  return nodes(r).filter(
    (n) => !within(n, isCoverage) && !within(n, (a) => coverageRefs.has(a.props.id)),
  );
}

const HEX = /^#[0-9a-f]{3,8}$/i;
const entries = Object.entries(AI_PROVIDER_LOGOS) as Array<[string, AiLogoComponent]>;

describe.each(entries)('%s', (_key, Logo) => {
  it('mono paints only the colour it is handed', () => {
    const r = render(<Logo variant="mono" color="#123456" />);
    const colours = paints(r)
      .flatMap((n) => [n.props.fill, n.props.stopColor])
      .filter((v): v is string => typeof v === 'string' && v !== 'none' && !v.startsWith('url('));
    expect(colours).toContain('#123456');
    expect(colours.filter((c) => c !== '#123456')).toEqual([]);
  });

  it(Logo.hasColor ? 'draws its own colours by default' : 'has no colour drawing, so default is mono', () => {
    const r = render(<Logo color="#123456" />);
    const hex = paints(r)
      .flatMap((n) => [n.props.fill, n.props.stopColor])
      .filter((v): v is string => typeof v === 'string' && HEX.test(v) && v !== '#123456');
    if (Logo.hasColor) expect(hex.length).toBeGreaterThan(0);
    else expect(hex).toEqual([]);
  });

  it('every url(#…) points at an id in the same drawing, and ids differ per instance', () => {
    const r = render(
      <>
        <Logo />
        <Logo />
      </>,
    );
    const ids = nodes(r)
      .map((n) => n.props.id)
      .filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of nodes(r)) {
      for (const v of Object.values(n.props)) {
        const m = typeof v === 'string' && /^url\(#(.+)\)$/.exec(v);
        if (m) expect(ids).toContain(m[1]);
      }
    }
  });

  it('carries no title, style string or foreign id prefix', () => {
    const r = render(<Logo />);
    for (const n of nodes(r)) {
      expect(n.type).not.toBe('title');
      if (n.props.id) expect(n.props.id).toMatch(/^ailogo-/);
    }
  });
});

describe('sizing and paint precedence', () => {
  const { openai: OpenAI } = AI_PROVIDER_LOGOS;
  const svg = (props: AiLogoProps) => render(<OpenAI {...props} />).root.findByType('Svg' as never);

  it('defaults to 20px', () => {
    expect(svg({}).props).toMatchObject({ width: 20, height: 20 });
  });

  it('takes a Bloom rung, a px size, or width', () => {
    expect(svg({ size: 'lg' }).props).toMatchObject({ width: 24, height: 24 });
    expect(svg({ size: 18 }).props).toMatchObject({ width: 18, height: 18 });
    expect(svg({ width: 40 }).props).toMatchObject({ width: 40, height: 40 });
  });

  it('fill beats color beats style.color beats currentColor', () => {
    const g = (props: AiLogoProps) =>
      render(<OpenAI {...props} />).root.findByType('G' as never).props.fill;
    expect(g({ fill: '#a00', color: '#0a0', style: { color: '#00a' } as never })).toBe('#a00');
    expect(g({ color: '#0a0', style: { color: '#00a' } as never })).toBe('#0a0');
    expect(g({ style: [{ color: '#00a' }] as never })).toBe('#00a');
    expect(g({})).toBe('currentColor');
  });

  it('exposes the brand name', () => {
    expect(OpenAI.logoName).toBe('OpenAI');
    expect(OpenAI.displayName).toBe('AiLogo(OpenAI)');
  });
});
