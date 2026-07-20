import { createMemo, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import type { BookFrontmatter } from '~content/config';

import { coverUrl as coverUrlFor } from '../../lib/covers';

import styles from './styles.module.css';

const CoverImage = (props: { book: BookFrontmatter }) => {
  const storygraphUrl = createMemo(() =>
    props.book.storygraphId ? `https://app.thestorygraph.com/books/${props.book.storygraphId}` : null,
  );
  const CoverWrap = createMemo(() => (storygraphUrl() ? 'a' : 'div'));
  const wrapProps = createMemo(() =>
    storygraphUrl()
      ? {
          href: storygraphUrl(),
          target: '_blank',
          rel: 'noopener',
        }
      : {},
  );

  // Prefer the locally-hosted, ID-keyed cover; fall back to any legacy hotlinked URL.
  const coverSrc = createMemo(() => coverUrlFor(props.book.coverImage));

  return (
    <Show when={coverSrc()}>
      {(url) => (
        <Dynamic component={CoverWrap()} class={styles.cover} {...wrapProps()}>
          <object data={url()} type="image/jpeg" aria-label={`Cover of ${props.book.title}`}>
            {/* TODO: cover placeholder element */}
            <span>{props.book.title}</span>
          </object>
        </Dynamic>
      )}
    </Show>
  );
};
export default CoverImage;
