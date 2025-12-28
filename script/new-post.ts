import cli from 'cli';
import { dasherize } from 'inflection';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stringify as toYaml } from 'yaml';

cli.setUsage('post:new [-d YYYY-MM-DD] [-x] "Post Title"');
const args = cli.parse({
  date: ['d', 'Date for the post (YYYY-MM-DD) - defaults to today', 'date', new Date()],
  mdx: ['x', 'Create as .mdx file instead of .md', 'bool', false],
  open: ['o', 'Open the new post in the default editor after creation', 'bool', false],
});

const date = (args.date as Date).toISOString().split('T')[0];
const title = cli.args.join(' ').trim();

if (!title) {
  cli.error('Title is required');
  throw cli.getUsage(1);
}

const slug = dasherize(title.toLocaleLowerCase());

const relativePath = `src/content/posts/${date}--${slug}.md${args.mdx ? 'x' : ''}`;
const filename = resolve(import.meta.dirname, `../${relativePath}`);

const content = `---
${toYaml({
  title,
  date,
}).trim()}
---

`;

await writeFile(filename, content, 'utf-8');

console.log(`Created new post at ${relativePath}`);
if (args.open) {
  cli.exec(`open "${filename}"`);
}
