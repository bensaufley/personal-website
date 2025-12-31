import type { Dayjs } from 'dayjs';
import { type JSX, mergeProps, type ParentProps, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import Timestamp from '../Timestamp';

import styles from './Post.module.css';

interface Props {
  title: string;
  titleElement?: keyof JSX.IntrinsicElements;
  posted: Date | Dayjs | number | string;
  href?: string;
  headerImage?:
    | {
        url: string;
        alt: string;
      }
    | undefined;
}

const Post = (_props: ParentProps<Props>) => {
  const props = mergeProps({ titleElement: 'h1' }, _props);
  return (
    <section class={styles.blogPost}>
      <header>
        <Dynamic component={props.titleElement}>
          <Show when={props.href} fallback={props.title}>
            <a href={props.href}>{props.title}</a>
          </Show>
        </Dynamic>
        <Timestamp value={props.posted} />
        <Show when={!!props.headerImage}>
          <img src={props.headerImage!.url} alt={props.headerImage!.alt} class={styles.headerImage} />
        </Show>
      </header>
      <main>{props.children}</main>
    </section>
  );
};
export default Post;
