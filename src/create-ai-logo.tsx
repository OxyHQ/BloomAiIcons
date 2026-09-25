import { forwardRef, useId } from 'react';
import Svg from 'react-native-svg';

import { type AiLogoComponent, type AiLogoDefinition, type AiLogoProps, sizes } from './types';

/** `style.color`, read through nested style arrays — without importing react-native. */
function styleColor(style: unknown): string | undefined {
  if (Array.isArray(style)) {
    for (let i = style.length - 1; i >= 0; i--) {
      const c = styleColor(style[i]);
      if (c !== undefined) return c;
    }
    return undefined;
  }
  const c = style && typeof style === 'object' ? (style as { color?: unknown }).color : undefined;
  return typeof c === 'string' ? c : undefined;
}

/** px for a `size` rung or number; falls back to `width`, then `height`, then 20. */
export function resolveLogoSize(
  size: AiLogoProps['size'],
  width?: AiLogoProps['width'],
  height?: AiLogoProps['height'],
): number {
  if (typeof size === 'number') return size;
  if (size && size in sizes) return sizes[size];
  const w = Number(width ?? height);
  return Number.isFinite(w) && w > 0 ? w : sizes.md;
}

/** A per-instance id prefix safe inside `url(#…)` (React's ids contain `:` or `«»`). */
export function useLogoIdPrefix(): string {
  return `ailogo-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
}

/** Builds a mark component from its drawings. Generated icon files call this. */
export function createAiLogo(def: AiLogoDefinition): AiLogoComponent {
  const Logo = forwardRef<Svg, AiLogoProps>(function AiLogo(props, ref) {
    const { size, width, height, fill, color, variant, style, ...rest } = props;
    const prefix = useLogoIdPrefix();
    const px = resolveLogoSize(size, width, height);
    const paint = {
      fill: fill ?? color ?? styleColor(style) ?? 'currentColor',
      id: (n: number) => `${prefix}-${n}`,
      url: (n: number) => `url(#${prefix}-${n})`,
    };
    const drawing = variant !== 'mono' && def.color ? def.color(paint) : def.mono(paint);
    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox={def.viewBox ?? '0 0 24 24'}
        width={px}
        height={px}
        style={style}>
        {drawing}
      </Svg>
    );
  });
  Logo.displayName = `AiLogo(${def.name})`;
  return Object.assign(Logo, { logoName: def.name, hasColor: Boolean(def.color) });
}
