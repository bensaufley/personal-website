import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { db } from './lib/build-db';
import { processTsgBook } from './lib/process-tsg-book';
import { req } from './lib/tsg-req';
import { upsertBook } from './lib/upsert-book';
import { debug, READ_BOOKS_PATH } from './lib/utils';

export const syncRead = async (since?: Dayjs) => {
  let earliestDate: Dayjs;
  if (since) {
    earliestDate = since;
  } else {
    const latestBook = db
      .prepare('SELECT MAX(finishedAt) as maxFinishedAt FROM books WHERE finishedAt IS NOT NULL AND hasReview = 1')
      .get();
    if (typeof latestBook?.maxFinishedAt !== 'string') {
      throw new Error('No books found in the database; could not determine earliest date to query');
    }
    earliestDate = dayjs(latestBook.maxFinishedAt);
  }
  for (let page = 1; page <= 10; page++) {
    const doc = await req(`${READ_BOOKS_PATH}?page=${page}&per_page=20`);

    const links = doc.querySelectorAll('.book-pane-content .book-title-author-and-series a[href^="/books/"]');
    if (!links.length) throw new Error(`No book links found on page:  ${READ_BOOKS_PATH}?page=${page}&per_page=20`);

    const paths = links.map((link) => link.getAttribute('href')!).filter((v, i, a) => a.indexOf(v) === i);
    if (!paths.length) {
      debug(`No book paths found on page ${page}; stopping.`);
      return;
    }

    for (const path of paths) {
      const processed = await processTsgBook(path);
      const { finishedAt } = processed;
      if (!finishedAt) {
        console.warn(`Book ${processed.title} does not have a finishedAt date; skipping.`);
        continue;
      }
      if (earliestDate.isAfter(finishedAt)) {
        // This assumes reverse chronological order of books
        debug(
          `Book ${processed.title} finishedAt date ${finishedAt.toISOString()} is before earliest date ${earliestDate.toISOString()}; returning.`,
        );
        return;
      }

      await upsertBook(processed);
    }

    page++;
  }
  throw new Error('Went too far back in time');
};
