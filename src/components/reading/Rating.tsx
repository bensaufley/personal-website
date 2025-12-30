import clsx from 'clsx';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

import styles from './styles.module.css';

const formatter = Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const Rating = (props: { rating: number | null }) => {
  const [shown, setShown] = createSignal(false);

  let ref: HTMLDivElement | undefined;
  let observer: IntersectionObserver | undefined;

  onMount(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setShown(!!entries.at(0)?.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observer.observe(ref);
  });

  onCleanup(() => {
    if (ref) observer?.unobserve(ref);
  });

  return (
    <Show when={props.rating !== null}>
      <div
        ref={ref}
        class={clsx(styles.rating, shown() && styles.visible)}
        style={{ '--rating': props.rating! }}
        title={`Rating: ${formatter.format(props.rating!)} / 5`}
      />
    </Show>
  );
};

export default Rating;
