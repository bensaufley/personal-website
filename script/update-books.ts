import cli from 'cli';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { request } from 'graphql-request';

import { GetBooksDocument } from './lib/graphql-operations';
import upsertBook from './lib/upsertBook';
import { defaultDate, getToken } from './lib/utils';

dayjs.extend(utc);

const args = cli.parse({
  token: ['t', 'Hardcover token', 'string'],
  since: ['s', 'Only update books since this date (ISO 8601)', 'date', defaultDate.format('YYYY-MM-DD')],
});

const token = await getToken(args.token);
const since = dayjs.utc(args.since);

const resp = await request(
  'https://api.hardcover.app/v1/graphql',
  GetBooksDocument,
  { minDate: since.format('YYYY-MM-DD') },
  {
    Authorization: token,
  },
);

cli.info(`Found ${resp.me[0]!.user_books.length} books since ${since.format('YYYY-MM-DD')}`);

const { user_books: books } = resp.me[0]!;
// eslint-disable-next-line no-restricted-syntax
for (const book of books) {
  await upsertBook(
    {
      slug: book.book.slug,
      title: book.book.title,
      subtitle: book.book.subtitle,
      contributions: book.edition?.contributions || [],
      isbn10: book.edition?.isbn_10,
      isbn13: book.edition?.isbn_13,
      asin: book.edition?.asin,
      editionId: book.edition?.id,
      editionImage: book.edition?.image?.url,
      bookImage: book.book.image?.url,
      releaseDate: book.book.release_date,
      series: book.book.book_series || [],
      review: book.review_slate
        ? {
            spoilers: book.review_has_spoilers ?? false,
            slate: book.review_slate,
          }
        : null,
    },
    {
      startedAt: book.reading_journals[0]?.started_at ? dayjs.utc(book.reading_journals[0].started_at).toDate() : null,
      finishedAt: book.last_read_date ? dayjs.utc(book.last_read_date).toDate() : null,
      rating: book.last_read_date ? (book.rating ?? null) : null,
    },
  );
}
