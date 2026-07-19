import { writeFile } from 'fs/promises';
import { parse } from 'node-html-parser';

import { processTsgBook } from './lib/process-tsg-book';
import { rawReq } from './lib/tsg-req';
import { upsertBook } from './lib/upsert-book';
import { TO_READ_PATH } from './lib/utils';

export const syncUpNext = async () => {
  const raw = await rawReq(TO_READ_PATH).then((res) => res.text());

  // Currently, the Up Next section is malformed, missing a closing </h3> after book titles, and needs adjustment to be parsed properly.
  const startOfSection = raw.indexOf('<div id="up-next-book-panes"');
  if (startOfSection < 0) throw new Error('Cannot find Up Next section on To Read page');
  const fromStart = raw.slice(startOfSection);
  const endOfSection = fromStart.indexOf('<hr ');
  if (endOfSection < 0) throw new Error('Cannot find end of Up Next section');
  let section = fromStart.slice(0, endOfSection);
  section = section.replaceAll(/(<h3.*(?<!<\/h3>)$)/gm, '$1</h3>');
  const doc = parse(section);

  const links = doc
    .getElementById('up-next-book-panes')
    ?.querySelectorAll('.book-pane-content .book-title-author-and-series a[href^="/books/"]');
  if (!links?.length) {
    await writeFile('debug.html', doc.innerHTML);
    throw new Error(`No book links found on page:  ${TO_READ_PATH}`);
  }

  const paths = links.map((link) => link.getAttribute('href')!).filter((v, i, a) => a.indexOf(v) === i);
  for (const path of paths) {
    const processed = await processTsgBook(path);
    const { startedAt, finishedAt } = processed;
    if (startedAt || finishedAt) {
      console.warn(`Book ${processed.title} is marked as started or finished; skipping.`);
      continue;
    }

    await upsertBook(processed);
  }
};
