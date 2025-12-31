import type { RootProps as TooltipRootProps } from '@corvu/tooltip';
import { type ClassValue, clsx } from 'clsx';
import { type JSX, mergeProps, type ParentComponent, type VoidComponent } from 'solid-js';

import Tooltip from './Tooltip';

type Props = {
  class?: ClassValue;
  icon: VoidComponent<JSX.SvgSVGAttributes<SVGSVGElement>>;
  invert?: boolean;
  tooltipProps?: Omit<TooltipRootProps, 'children'>;
  zIndex?: number;
} & (
  | {
      href: string;
      onClick?: never;
    }
  | {
      href?: never;
      onClick: (event: MouseEvent) => void;
    }
);

const TooltipIcon: ParentComponent<Props> = (_props) => {
  const props = mergeProps({ invert: false, tooltipProps: {} }, _props);

  return (
    <Tooltip
      invert={props.invert}
      class={clsx(props.class)}
      content={props.children}
      as={props.href ? 'a' : 'button'}
      {...(props.href
        ? {
            href: props.href,
            ...(props.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          }
        : { onClick: props.onClick })}
      tooltipProps={props.tooltipProps}
      zIndex={props.zIndex}
    >
      <props.icon fill="currentColor" />
    </Tooltip>
  );
};
export default TooltipIcon;
