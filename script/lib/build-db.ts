// A helper file to sync all md{,x} files into a Node SQLite db for easier querying and processing.
import { glob, readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { parse } from 'yaml';

import type { BookFrontmatter } from '~content/config';

const dbPath = process.env.SYNC_DB_PATH ?? ':memory:';

export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE books (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    authors JSONB NOT NULL,
    narrators JSONB,
    yearPublished INTEGER,
    isbn10 TEXT,
    isbn13 TEXT,
    asin TEXT,
    finishedAt TEXT,
    startedAt TEXT,
    rating INTEGER,
    hardcoverUrl TEXT,
    storygraphId TEXT,
    coverImage TEXT
  );
  CREATE UNIQUE INDEX idx_storygraph_id ON books(storygraphId);
`);

const mdFiles = glob('src/content/books/*.md{,x}');

const addBook = db.prepare(
  `
    INSERT INTO books (
      slug,
      title,
      subtitle,
      authors,
      yearPublished,
      isbn10,
      isbn13,
      asin,
      finishedAt,
      startedAt,
      rating,
      narrators,
      hardcoverUrl,
      storygraphId,
      coverImage
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(slug) DO UPDATE SET
      title=excluded.title,
      subtitle=excluded.subtitle,
      authors=excluded.authors,
      yearPublished=excluded.yearPublished,
      isbn10=excluded.isbn10,
      isbn13=excluded.isbn13,
      asin=excluded.asin,
      finishedAt=excluded.finishedAt,
      startedAt=excluded.startedAt,
      rating=excluded.rating,
      narrators=excluded.narrators,
      hardcoverUrl=excluded.hardcoverUrl,
      storygraphId=excluded.storygraphId,
      coverImage=excluded.coverImage
    `,
);

for await (const mdFile of mdFiles) {
  const content = await readFile(mdFile, 'utf-8');
  const slug = basename(mdFile).split('.').slice(0, -1).join('.');
  const frontmatter = parse(content.split('---')[1]!) as BookFrontmatter;
  addBook.run(
    slug,
    frontmatter.title,
    frontmatter.subtitle,
    JSON.stringify(frontmatter.authors),
    frontmatter.yearPublished,
    frontmatter.isbn10,
    frontmatter.isbn13,
    frontmatter.asin,
    frontmatter.finishedAt instanceof Date
      ? frontmatter.finishedAt.toISOString()
      : ((frontmatter.finishedAt as string | null | undefined) ?? null),
    frontmatter.startedAt instanceof Date
      ? frontmatter.startedAt.toISOString()
      : ((frontmatter.startedAt as string | null | undefined) ?? null),
    frontmatter.rating,
    frontmatter.narrators ? JSON.stringify(frontmatter.narrators) : null,
    frontmatter.hardcoverUrl ?? null,
    frontmatter.storygraphId ?? null,
    frontmatter.coverImage ?? null,
  );
}

const getBookQuery = db.prepare(`
  SELECT
    slug,
    title,
    subtitle,
    authors,
    yearPublished,
    isbn10,
    isbn13,
    asin,
    finishedAt,
    startedAt,
    rating,
    narrators,
    hardcoverUrl,
    storygraphId,
    coverImage
  FROM books
  WHERE slug = ?
`);
export const getBook = (slug: string) => {
  const result = getBookQuery.get(slug);
  if (!result) return null;

  return {
    slug: result.slug,
    title: result.title,
    subtitle: result.subtitle,
    authors: JSON.parse(result.authors as string),
    yearPublished: result.yearPublished,
    isbn10: result.isbn10,
    isbn13: result.isbn13,
    asin: result.asin,
    finishedAt: result.finishedAt ? new Date(Date.parse(result.finishedAt as string)) : null,
    startedAt: result.startedAt ? new Date(Date.parse(result.startedAt as string)) : null,
    rating: result.rating,
    narrators: result.narrators ? JSON.parse(result.narrators as string) : null,
    hardcoverUrl: result.hardcoverUrl,
    storygraphId: result.storygraphId,
    coverImage: result.coverImage,
  } as BookFrontmatter;
};
