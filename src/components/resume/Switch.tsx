import ImageSquareFill from '@phosphor-icons/core/fill/image-square-fill.svg?component-solid';
import clsx from 'clsx';
import { createMemo, type Signal, type VoidComponent } from 'solid-js';

import Tooltip from '~components/Tooltip';

import styles from './styles.module.css';

interface Props {
  showIcons: Signal<boolean>;
}

const Switch: VoidComponent<Props> = (props) => {
  const content = createMemo(() => `Show as ${props.showIcons[0]() ? 'text' : 'icons'}`);

  return (
    <div class={styles.switch}>
      <Tooltip
        class={styles.switch}
        content={content}
        as="button"
        onClick={() => props.showIcons[1]((prev) => !prev)}
        type="button"
      >
        <span class={clsx(!props.showIcons[0]() && styles.selected)}>T</span>
        <span class={clsx(props.showIcons[0]() && styles.selected)}>
          <ImageSquareFill />
        </span>
      </Tooltip>
    </div>
  );
};

export default Switch;
