import { createMemo, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import type { BookFrontmatter } from '~content/config';

import styles from './styles.module.css';

const CoverImage = (props: { book: BookFrontmatter }) => {
  const CoverWrap = createMemo(() => (props.book.hardcoverUrl ? 'a' : 'div'));
  const coverProps = createMemo(() =>
    props.book.hardcoverUrl
      ? {
          href: props.book.hardcoverUrl,
          target: '_blank',
          rel: 'noopener',
        }
      : {},
  );

  return (
    <Show when={props.book.coverImageUrl}>
      {(url) => (
        <Dynamic component={CoverWrap()} class={styles.cover} {...coverProps()}>
          <img src={url()} alt={`Cover of ${props.book.title}`} loading="lazy" />
        </Dynamic>
      )}
    </Show>
  );
};
export default CoverImage;
