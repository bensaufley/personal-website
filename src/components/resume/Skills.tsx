import { createSignal, onMount, type ParentComponent } from 'solid-js';

import SkillSet from './SkillSet';
import Switch from './Switch';

import styles from './styles.module.css';

interface Props {
  initialShowIcons?: boolean;
}

// only using ParentComponent to allow the children prop for the Astro fallback;
// the actual Solid component doesn't use it.
const Skills: ParentComponent<Props> = (props) => {
  const [showIcons, setShowIcons] = createSignal(props.initialShowIcons ?? false);

  onMount(() => {
    if (props.initialShowIcons !== undefined) return;
    setShowIcons(typeof window !== 'undefined');
  });

  return (
    <section class={styles.skills}>
      <header>
        <h2>Skills</h2>
        {typeof window !== 'undefined' && <Switch showIcons={[showIcons, setShowIcons]} />}
      </header>
      <SkillSet
        showIcons={showIcons}
        title="Languages"
        skills={[
          [
            { name: 'TypeScript', icon: 'TypeScript', link: 'https://www.typescriptlang.org/' },
            { name: 'JavaScript', icon: 'JavaScript', link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
          ],
          { name: 'Go', icon: 'Go', link: 'https://golang.org/' },
          { name: 'Node.js', icon: 'Node', link: 'https://nodejs.org/' },
          { name: 'HTML', icon: 'Html', link: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
          [
            { name: 'CSS', icon: 'CSS', link: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
            { name: 'SASS', icon: 'SASS', link: 'https://sass-lang.com/' },
            { name: 'PostCSS', icon: 'PostCSS', link: 'https://postcss.org/' },
          ],
          [
            { name: 'MySQL', icon: 'MySQL', link: 'https://www.mysql.com/' },
            { name: 'Postgres', icon: 'Postgres', link: 'https://www.postgresql.org/' },
          ],
          { name: 'PHP', icon: 'Php', link: 'https://www.php.net/' },
          { name: 'Ruby', icon: 'Ruby', link: 'https://www.ruby-lang.org/' },
          { name: 'Python', icon: 'Python', link: 'https://www.python.org/' },
          { name: 'Kotlin', icon: 'Kotlin', link: 'https://kotlinlang.org/' },
          [
            { name: 'bash', icon: 'Bash', link: 'https://www.gnu.org/software/bash/' },
            { name: 'zsh', icon: 'Zsh', link: 'https://zsh.sourceforge.io/' },
          ],
        ]}
      />

      <SkillSet
        showIcons={showIcons}
        title="Frameworks & Libraries"
        skills={[
          [
            { name: 'React', icon: 'React', link: 'https://react.dev/' },
            { name: 'Preact', icon: 'Preact', link: 'https://preactjs.com/' },
          ],
          { name: 'Next.js', icon: 'NextDotJs', link: 'https://nextjs.org/' },
          { name: 'Redux', icon: 'Redux', link: 'https://redux.js.org/' },
          { name: 'Solid.js', icon: 'Solid', link: 'https://www.solidjs.com/' },
          { name: 'Laravel', icon: 'Laravel', link: 'https://laravel.com/' },
          { name: 'Ruby on Rails', icon: 'RubyOnRails', link: 'https://rubyonrails.org/' },
          { name: 'Express.js', icon: 'Express', link: 'https://expressjs.com/' },
          { name: 'FastAPI', icon: 'FastAPI', link: 'https://fastapi.tiangolo.com/' },
          { name: 'jQuery', icon: 'jQuery', link: 'https://jquery.com/' },
        ]}
      />

      <SkillSet
        showIcons={showIcons}
        title="Platforms & Infrastructure"
        skills={[
          { name: 'Docker', icon: 'Docker', link: 'https://www.docker.com/' },
          { name: 'Kubernetes', icon: 'Kubernetes', link: 'https://kubernetes.io/' },
          { name: 'AWS', icon: 'AWS', link: 'https://aws.amazon.com/' },
          { name: 'GCP', icon: 'GCP', link: 'https://cloud.google.com/' },
          { name: 'Terraform', icon: 'Terraform', link: 'https://www.terraform.io/' },
          { name: 'GitHub Actions', icon: 'GitHub', link: 'https://github.com/features/actions' },
          { name: 'CircleCI', icon: 'CircleCI', link: 'https://circleci.com/' },
          { name: 'Bamboo', icon: 'Bamboo', link: 'https://www.atlassian.com/software/bamboo' },
        ]}
      />

      <SkillSet
        showIcons={showIcons}
        title="Testing & Quality"
        skills={[
          { name: 'Vitest', icon: 'Vitest', link: 'https://vitest.dev/' },
          { name: 'Jest', icon: 'Jest', link: 'https://jestjs.io/' },
          { name: 'Playwright', icon: 'Playwright', link: 'https://playwright.dev/' },
          [
            { name: 'Mocha', icon: 'Chai', link: 'https://mochajs.org/' },
            { name: 'Chai', icon: 'Chai', link: 'https://www.chaijs.com/' },
          ],
          { name: 'RSpec', icon: 'RSpec', link: 'https://rspec.info/' },
          [
            { name: 'ESLint', icon: 'ESLint', link: 'https://eslint.org/' },
            { name: 'Oxlint', icon: 'Oxlint', link: 'https://oxc.rs/docs/guide/usage/linter.html' },
          ],
          { name: 'Prettier', icon: 'Prettier', link: 'https://prettier.io/' },
        ]}
      />

      <SkillSet
        showIcons={showIcons}
        title="Observability"
        skills={[
          { name: 'DataDog', icon: 'DataDog', link: 'https://www.datadoghq.com/' },
          [
            { name: 'Grafana', icon: 'Grafana', link: 'https://grafana.com/' },
            { name: 'Prometheus', icon: 'Prometheus', link: 'https://prometheus.io/' },
            { name: 'Loki', icon: 'Loki', link: 'https://grafana.com/oss/loki/' },
          ],
          { name: 'Sentry', icon: 'Sentry', link: 'https://sentry.io/' },
        ]}
      />

      <SkillSet
        showIcons={showIcons}
        title="Design"
        skills={[
          { name: 'Figma', icon: 'Figma', link: 'https://www.figma.com/' },
          { name: 'Sketch', icon: 'Sketch', link: 'https://www.sketch.com/' },
          { name: 'Adobe Creative Cloud', icon: 'Adobe', link: 'https://www.adobe.com/creativecloud.html' },
        ]}
      />
    </section>
  );
};

export default Skills;
