import React from 'react';

/**
 * Jest mock for `react-native-svg`: the real package needs a React Native
 * runtime. Each export is a host-element stand-in that forwards its props and
 * children, so tests assert the tree a mark draws — ids, paints, sizes — not
 * pixels.
 */
const createSvgComponent = (name: string) => {
  const Component = React.forwardRef(
    (props: Record<string, unknown>, ref: unknown) => {
      const { children, ...rest } = props;
      return React.createElement(name, { ref, ...rest }, children as React.ReactNode);
    },
  );
  Component.displayName = name;
  return Component;
};

export const Svg = createSvgComponent('Svg');
export const Path = createSvgComponent('Path');
export const Circle = createSvgComponent('Circle');
export const Rect = createSvgComponent('Rect');
export const G = createSvgComponent('G');
export const Defs = createSvgComponent('Defs');
export const LinearGradient = createSvgComponent('LinearGradient');
export const RadialGradient = createSvgComponent('RadialGradient');
export const Stop = createSvgComponent('Stop');
export const ClipPath = createSvgComponent('ClipPath');
export const Mask = createSvgComponent('Mask');
export const Line = createSvgComponent('Line');
export const Polygon = createSvgComponent('Polygon');
export const Polyline = createSvgComponent('Polyline');
export const Ellipse = createSvgComponent('Ellipse');
export const Text = createSvgComponent('SvgText');
export const TSpan = createSvgComponent('TSpan');
// `<Image href>` inside an `<Svg>` — the squircle avatar's clipped image.
export const Image = createSvgComponent('SvgImage');

export default Svg;
