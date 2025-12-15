/* eslint-disable import/no-extraneous-dependencies */
import type { RehypePlugin } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';

const externalLinksPlugin: RehypePlugin = () => (tree) => {
  visit(tree, 'element', (node) => {
    if (
      node.tagName === 'a' &&
      ((href) => href?.startsWith('http') && !href?.includes('bensaufley.com'))(node.properties?.href?.toString())
    ) {
      // eslint-disable-next-line no-param-reassign
      node.properties.target = '_blank';
    }
  });
};
export default externalLinksPlugin;
