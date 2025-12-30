import clsx from 'clsx';
import { createMemo, For, Show } from 'solid-js';

import styles from './styles.module.css';

interface Props {
  /** 1-indexed */
  page: number;
  path: string;
  pages: number;
}

const Pagination = (props: Props) => {
  const showFirst = createMemo(() => props.page > 2);
  const showPrev = createMemo(() => props.page > 1);
  const showNext = createMemo(() => props.page < props.pages - 1);
  const showLast = createMemo(() => props.page < props.pages - 2);

  const length = createMemo(() => Math.min(props.pages - 1, 7));
  const first = createMemo(() => Math.max(props.page - 3, 1));
  const last = createMemo(() => Math.min(first() + length() - 1, props.pages - 1));
  const numberedPages = createMemo(() =>
    Array.from({ length: length() }, (_, i) => i).map((i) => last() - (length() - i) + 1),
  );

  return (
    <div class={styles.pageNav}>
      <Show when={showFirst}>
        <a href={props.path}>&#9666;&#9666;</a>
      </Show>
      <Show when={showPrev}>
        <a href={props.page - 1 === 1 ? props.path : `${props.path}${props.page - 1}`}>&#9666; Previous</a>
      </Show>
      <For each={numberedPages()}>
        {(n) => (
          <a href={`${props.path}${n === 1 ? '' : n}`} class={clsx(n === props.page && styles.active)}>
            {n}
          </a>
        )}
      </For>
      <Show when={showNext}>
        <a href={`${props.path}${props.page + 1}`}>Next &#9656;</a>
      </Show>
      <Show when={showLast}>
        <a href={`${props.path}${props.pages - 1}`}>&#9656;&#9656;</a>
      </Show>
    </div>
  );
};

export default Pagination;
