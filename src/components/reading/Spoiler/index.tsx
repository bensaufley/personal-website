import clsx from 'clsx';
import { createSignal, type ParentProps } from 'solid-js';

import styles from './styles.module.css';

const Spoiler = (props: ParentProps<{ hide?: boolean }>) => {
  // eslint-disable-next-line solid/reactivity
  const [hide, setHide] = createSignal(props.hide ?? true);

  return (
    <spoiler
      data-hide={hide()}
      class={clsx(styles.spoiler, !hide() && styles.visible)}
      title={hide() ? 'Spoiler - click to reveal' : undefined}
      onClick={(e) => {
        e.preventDefault();
        setHide((prev) => !prev);
      }}
      tabindex={0}
    >
      {props.children}
    </spoiler>
  );
};

export default Spoiler;
