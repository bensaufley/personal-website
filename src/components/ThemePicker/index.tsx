import CircleHalfTilt from '@phosphor-icons/core/fill/circle-half-tilt-fill.svg?component-solid';
import MoonStars from '@phosphor-icons/core/fill/moon-stars-fill.svg?component-solid';
import Sun from '@phosphor-icons/core/fill/sun-fill.svg?component-solid';
import clsx from 'clsx';
import { type ComponentProps, createEffect, createSignal } from 'solid-js';

import type Tooltip from '~components/Tooltip';

import TooltipIcon from '../TooltipIcon';

import styles from './styles.module.css';

interface Props {
  context: 'header' | 'footer';
  invert?: boolean;
}

const [theme, setTheme] = createSignal<'light' | 'dark' | null>(
  window.localStorage.getItem('theme') as 'light' | 'dark' | null,
);

createEffect(() => {
  const t = theme();

  document.documentElement.classList.remove('light', 'dark');
  if (t) document.documentElement.classList.add(t);
});

const updateTheme = (newTheme: 'light' | 'dark' | null) => {
  setTheme(newTheme);

  if (!newTheme) window.localStorage.removeItem('theme');
  else window.localStorage.setItem('theme', newTheme);
};

const tooltipProps: ComponentProps<typeof Tooltip>['tooltipProps'] = {
  group: 'themePicker',
  floatingOptions: {
    autoPlacement: {
      allowedPlacements: ['top', 'top-end', 'top-start', 'bottom', 'bottom-end', 'bottom-start'],
    },
  },
};

const ThemePicker = ({ context, invert = false }: Props) => (
  <div class={clsx(styles.themeToggle, styles[context])}>
    <TooltipIcon
      onClick={() => updateTheme('light')}
      class={styles.light}
      invert={invert}
      tooltipProps={tooltipProps}
      zIndex={11}
      icon={Sun}
    >
      Use Light Theme
    </TooltipIcon>
    <TooltipIcon
      onClick={() => updateTheme(null)}
      class={styles.system}
      invert={invert}
      tooltipProps={tooltipProps}
      zIndex={11}
      icon={CircleHalfTilt}
    >
      Use System Theme
    </TooltipIcon>
    <TooltipIcon
      onClick={() => updateTheme('dark')}
      class={styles.dark}
      invert={invert}
      tooltipProps={tooltipProps}
      zIndex={11}
      icon={MoonStars}
    >
      Use Dark Theme
    </TooltipIcon>
  </div>
);

export default ThemePicker;
