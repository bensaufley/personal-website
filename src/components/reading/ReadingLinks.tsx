import TheStoryGraph from 'simple-icons/icons/thestorygraph.svg?component-solid';

import Fable from '../../assets/images/brand-fable.svg?component-solid';
import TooltipIcon from '../TooltipIcon';

import styles from './styles.module.css';

const ReadingLinks = () => (
  <div class={styles.readingLinks}>
    <p>I’m also here:</p>
    <TooltipIcon icon={TheStoryGraph} href="https://app.thestorygraph.com/profile/bnsfly">
      The StoryGraph
    </TooltipIcon>
    <TooltipIcon icon={Fable} href="https://fable.co/ben-475373834381">
      Fable
    </TooltipIcon>
  </div>
);

export default ReadingLinks;
