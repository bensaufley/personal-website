import { type Accessor, For, type VoidComponent } from 'solid-js';

import type * as icons from './icons';
import Skill from './Skill';

import styles from './styles.module.css';

export type IconName = keyof typeof icons;

export interface SkillInfo {
  name: string;
  icon: IconName;
  link?: string;
}

interface Props {
  title: string;
  showIcons: Accessor<boolean>;
  skills: readonly (SkillInfo | readonly SkillInfo[])[];
}

if (import.meta.env.DEV) {
  // eslint-disable-next-line import/no-extraneous-dependencies
  await import('solid-devtools');
}

const SkillSet: VoidComponent<Props> = (props) => (
  <section class={styles.skillSet}>
    <h4>{props.title}</h4>
    <div class={styles.list}>
      <For each={props.skills}>
        {(skill, i) => (
          <Skill
            index={i()}
            group={props.title}
            showIcons={props.showIcons}
            skills={Array.isArray(skill) ? skill : [skill]}
          />
        )}
      </For>
    </div>
  </section>
);

export default SkillSet;
