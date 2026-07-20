import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { db } from './lib/build-db';
import { processTsgBook } from './lib/process-tsg-book';
import { req } from './lib/tsg-req';
import { upsertBook } from './lib/upsert-book';
import { READ_BOOKS_PATH } from './lib/utils';

export const syncRead = async (since?: Dayjs) => {
  let earliestDate: Dayjs;
  if (since) {
    earliestDate = since;
  } else {
    const latestBook = db.prepare('SELECT MAX(finishedAt) as maxFinishedAt FROM books').get();
    if (typeof latestBook?.maxFinishedAt !== 'string') {
      throw new Error('No books found in the database; could not determine earliest date to query');
    }
    earliestDate = dayjs(latestBook.maxFinishedAt);
  }
  let earliestFinishedAt: Date | undefined;
  for (let page = 1; page <= 10; page++) {
    const doc = await req(`${READ_BOOKS_PATH}?page=${page}&per_page=20`);

    const links = doc.querySelectorAll('.book-pane-content .book-title-author-and-series a[href^="/books/"]');
    if (!links.length) throw new Error(`No book links found on page:  ${READ_BOOKS_PATH}?page=${page}&per_page=20`);

    const paths = links.map((link) => link.getAttribute('href')!).filter((v, i, a) => a.indexOf(v) === i);
    for (const path of paths) {
      const processed = await processTsgBook(path);
      const { finishedAt } = processed;
      if (!finishedAt) {
        console.warn(`Book ${processed.title} does not have a finishedAt date; skipping.`);
        continue;
      }
      if (earliestDate.isAfter(finishedAt)) continue;

      await upsertBook(processed);

      if (!earliestFinishedAt) earliestFinishedAt = finishedAt;
      else if (dayjs(earliestFinishedAt).isAfter(finishedAt, 'day')) earliestFinishedAt = finishedAt;
    }
    if (!earliestFinishedAt) return;
    if (!dayjs(earliestDate).isBefore(earliestFinishedAt, 'day')) return;

    page++;
  }
  throw new Error('Went too far back in time');
};
