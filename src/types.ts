import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';
import type Svg from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

/** Bloom's icon size rungs, in px — the same table `@oxy.so/bloom/icons` uses. */
export const sizes = {
  '2xs': 8,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 48,
} as const;

export type AiLogoSizeRung = keyof typeof sizes;

/** `'color'` draws the brand's own colours; `'mono'` draws one colour. */
export type AiLogoVariant = 'color' | 'mono';

/**
 * Props every mark takes. The same surface as a Bloom `Ri*` icon — `size` (a
 * rung, or px), `width` / `height`, `fill` — plus `color`, so a mark also fits
 * slots that paint with `{ size, color }` (the ModelPicker's provider `logo`).
 */
export interface AiLogoProps extends Omit<SvgProps, 'fill' | 'color'> {
  /** A Bloom rung (`'sm'`, `'md'`, …) or a px number. Default 20 (`md`). */
  size?: AiLogoSizeRung | number;
  /** Mono paint. Wins over `color` and `style.color`. */
  fill?: string;
  /** Mono paint, when `fill` is not given. Default `currentColor`. */
  color?: string;
  /** Default `'color'` for marks that have a colour drawing; others are always mono. */
  variant?: AiLogoVariant;
}

/** What a drawing receives at render time. */
export interface AiLogoPaint {
  /** The resolved mono paint. */
  fill: string;
  /** A per-instance id for the drawing's n-th `id`. */
  id: (n: number) => string;
  /** `url(#…)` for the drawing's n-th `id`. */
  url: (n: number) => string;
}

export interface AiLogoDefinition {
  /** The brand as written, e.g. `'OpenAI'`. */
  name: string;
  /** Default `'0 0 24 24'`. */
  viewBox?: string;
  mono: (paint: AiLogoPaint) => ReactNode;
  color?: (paint: AiLogoPaint) => ReactNode;
}

export type AiLogoComponent = ForwardRefExoticComponent<AiLogoProps & RefAttributes<Svg>> & {
  /** The brand as written, e.g. `'OpenAI'`. */
  readonly logoName: string;
  /** Whether the mark has a full-colour drawing. */
  readonly hasColor: boolean;
};
