import { processTsgBook } from './lib/process-tsg-book';
import { req } from './lib/tsg-req';
import { upsertBook } from './lib/upsert-book';
import { TO_READ_PATH } from './lib/utils';

export const syncUpNext = async () => {
  const doc = await req(`${TO_READ_PATH}?page=1&per_page=50`);

  const links = doc.querySelectorAll(
    '.up-next-book-panes .book-pane-content .book-title-author-and-series a[href^="/books/"]',
  ) as unknown as HTMLAnchorElement[];
  if (!links.length) {
    throw new Error(`No book links found on page:  ${TO_READ_PATH}?page=1&per_page=50`);
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
