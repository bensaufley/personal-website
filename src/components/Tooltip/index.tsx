import Tt, { type RootProps } from '@corvu/tooltip';
import { type ClassValue, clsx } from 'clsx';
import { type Accessor, type JSX, mergeProps, type ParentComponent, splitProps } from 'solid-js';

import styles from './styles.module.css';

interface Props {
  content: JSX.Element | Accessor<JSX.Element>;
  children: JSX.Element;
  tooltipProps?: Omit<RootProps, 'children'>;
  anchorClass?: ClassValue;
  invert?: boolean;
  zIndex?: number | undefined;
}

export default function Tooltip(
  props: Props & { as?: 'div' } & Omit<JSX.IntrinsicElements['div'], 'as' | keyof Props>,
): JSX.Element;
export default function Tooltip<C extends ParentComponent<P>, P extends Record<string, any>>(
  props: Props & { as: C } & Omit<P, 'as' | keyof Props>,
): JSX.Element;
export default function Tooltip<E extends keyof JSX.IntrinsicElements>(
  props: Props & { as: E } & Omit<JSX.IntrinsicElements[E], 'as' | keyof Props>,
): JSX.Element;
export default function Tooltip(
  _props: Props & { as?: keyof JSX.IntrinsicElements | ParentComponent<any> } & Record<string, any>,
): JSX.Element {
  const originalProps = mergeProps({ as: 'div' }, _props);
  const [props, rest] = splitProps(originalProps, [
    'as',
    'children',
    'content',
    'anchorClass',
    'invert',
    'tooltipProps',
    'zIndex',
  ]);
  return (
    <Tt
      openDelay={0}
      closeDelay={0}
      floatingOptions={{
        autoPlacement: true,
        offset: 10,
        ...props.tooltipProps?.floatingOptions,
      }}
      {...props.tooltipProps}
    >
      <Tt.Anchor class={clsx(props.anchorClass)}>
        <Tt.Trigger as={props.as} {...rest}>
          {props.children}
        </Tt.Trigger>
      </Tt.Anchor>
      <Tt.Portal>
        <Tt.Content
          class={clsx(styles.tooltipContent, props.invert && styles.invert)}
          style={{ 'z-index': props.zIndex }}
        >
          {typeof props.content === 'function' ? props.content() : props.content}
          <Tt.Arrow class={styles.tooltipArrow} />
        </Tt.Content>
      </Tt.Portal>
    </Tt>
  );
}
