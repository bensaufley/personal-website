import { processTsgBook } from './lib/process-tsg-book';
import { req } from './lib/tsg-req';
import { upsertBook } from './lib/upsert-book';
import { CURRENT_READING_PATH } from './lib/utils';

export const syncReading = async () => {
  const doc = await req(`${CURRENT_READING_PATH}?page=1&per_page=50`);

  const links = doc.querySelectorAll(
    '.book-pane-content .book-title-author-and-series a[href^="/books/"]',
  ) as unknown as HTMLAnchorElement[];
  if (!links.length) {
    throw new Error(`No book links found on page:  ${CURRENT_READING_PATH}?page=1&per_page=50`);
  }

  const paths = links.map((link) => link.getAttribute('href')!).filter((v, i, a) => a.indexOf(v) === i);
  for (const path of paths) {
    const processed = await processTsgBook(path);
    const { startedAt } = processed;
    if (!startedAt) {
      console.warn(`Book ${processed.title} does not have a startedAt date; skipping.`);
      continue;
    }

    await upsertBook(processed);
  }
};
