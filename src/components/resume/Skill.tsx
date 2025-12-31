import { clsx } from 'clsx';
import { type Accessor, createSignal, For, onCleanup, onMount, Show, type VoidComponent } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import Tooltip from '~components/Tooltip';

import * as icons from './icons';
import type { SkillInfo } from './SkillSet';

import styles from './styles.module.css';

interface Props {
  index: number;
  group: string;
  showIcons: Accessor<boolean>;
  skills: readonly SkillInfo[];
}

const MultiIcon: VoidComponent<{ delay: number; group: string; grouped: readonly SkillInfo[] }> = (props) => {
  const [hover, setHover] = createSignal(false);
  const [current, setCurrent] = createSignal(0);

  let interval: NodeJS.Timeout | undefined;
  onMount(() => {
    setTimeout(() => {
      interval = setInterval(() => {
        if (hover()) return;
        setCurrent((prev) => (prev + 1) % props.grouped.length);
      }, 3_000);
    }, props.delay * 250);
  });

  onCleanup(() => interval && clearInterval(interval));

  return (
    <Tooltip
      tooltipProps={{
        onHover: () => setHover(true),
        onLeave: () => setHover(false),
        group: props.group,
      }}
      content={
        <For each={props.grouped}>
          {({ name, link }, i) => (
            <>
              <a href={link} target="_blank" rel="noopener noreferrer">
                <Show when={i() === current()} fallback={name}>
                  <strong>{name}</strong>
                </Show>
              </a>
              {i() < props.grouped.length - 1 && ', '}
            </>
          )}
        </For>
      }
    >
      <For each={props.grouped}>
        {({ icon, link }, i) => (
          <a class={clsx(i() === current() && styles.visible)} href={link} target="_blank" rel="noopener noreferrer">
            <Dynamic
              component={icons[icon]!}
              aria-hidden
              fill="currentColor"
              class={clsx(i() === current() && styles.visible)}
            />
          </a>
        )}
      </For>
    </Tooltip>
  );
};

const Plaintext: VoidComponent<{ grouped: readonly SkillInfo[] }> = (props) => (
  <For each={props.grouped}>
    {({ name, link }, i) => (
      <>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <span>{name}</span>
        </a>
        <Show when={i() < props.grouped.length - 1}>/</Show>
      </>
    )}
  </For>
);

const Skill: VoidComponent<Props> = (props) => (
  <div class={styles.skill}>
    <Show when={props.showIcons()} fallback={<Plaintext grouped={props.skills} />}>
      <MultiIcon group={props.group} grouped={props.skills} delay={props.index} />
    </Show>
  </div>
);

export default Skill;
