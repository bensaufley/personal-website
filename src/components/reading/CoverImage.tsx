import { createMemo, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import type { BookFrontmatter } from '~content/config';

import styles from './styles.module.css';

const CoverImage = (props: { book: BookFrontmatter }) => {
  // Access the specific property directly in the memo to track only that value
  const hardcoverUrl = createMemo(() => props.book.hardcoverUrl);
  const CoverWrap = createMemo(() => (hardcoverUrl() ? 'a' : 'div'));
  const coverProps = createMemo(() =>
    hardcoverUrl()
      ? {
          href: hardcoverUrl(),
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
