import Enquirer from 'enquirer';

import { req } from './lib/tsg-req';
import { upsertBook } from './lib/upsertBook';
import { SEARCH_PATH } from './lib/utils';

const searchStr = process.argv.at(-1);
if (!searchStr) {
  console.error('Please provide a search string.');
  process.exit(1);
}

const dom = await req(SEARCH_PATH.replace('%s', encodeURIComponent(searchStr)));

const ul = dom.getElementById('search-results-ul');
const items = ul?.querySelectorAll('li a[href^="/book"]') as HTMLAnchorElement[] | undefined;
if (!items?.length) {
  console.error('No search results found for the provided search string.');
  process.exit(1);
}

let href: string | undefined;
if (items.length > 1) {
  const enquirer = new Enquirer<{ selection: string }>();
  const response = await enquirer.prompt({
    type: 'select',
    name: 'selection',
    message: 'Multiple search results found. Please select the correct one:',
    choices: items.map((item) => ({
      name: item.textContent
        ?.trim()
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean)
        .join(' - '),
      value: item.getAttribute('href')!,
    })),
  });
  href = response.selection;
} else {
  href = items.at(0)!.getAttribute('href')!;
}

if (!/\/books\//.test(href ?? '')) {
  console.error('Failed to extract book URL from search results.');
  console.debug({ items, href });
  process.exit(1);
}

await upsertBook(href);
