import cli from 'cli';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Enquirer from 'enquirer';
import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import prettier from 'prettier';
import { stringify } from 'yaml';

import type { BookFrontmatter } from '~content/config';

import slateToMd, { type ReviewSlate } from './slateToMd';
import { parseAuthor, parseAuthors } from './utils';

dayjs.extend(utc);

const enquirer = new Enquirer<{
  shouldAdd?: boolean;
  editBook?: boolean;
  changeField?: string;
  newValue?: string;
  saveBook?: boolean;
}>();

const dirname = import.meta.dirname ?? __dirname;

const prettierRc = JSON.parse(await readFile(resolve(dirname, '../../.prettierrc'), 'utf-8'));

const upsertBook = async (
  {
    slug = null,
    title = null,
    subtitle = null,
    contributions,
    isbn10 = null,
    isbn13 = null,
    asin = null,
    editionId = null,
    editionImage = null,
    bookImage = null,
    releaseDate = null,
    series,
    review,
  }: {
    slug: string | null | undefined;
    title: string | null | undefined;
    subtitle: string | null | undefined;
    contributions: { contribution?: string | null; author?: { name?: string | null } | null }[];
    isbn10: string | null | undefined;
    isbn13: string | null | undefined;
    asin: string | null | undefined;
    editionId: number | null | undefined;
    editionImage: string | null | undefined;
    bookImage: string | null | undefined;
    releaseDate: string | null | undefined;
    series: { series?: { name: string } | null; position?: number | null }[];
    review?: {
      spoilers: boolean;
      slate: ReviewSlate | null;
    } | null;
  },
  extraFields?: Partial<BookFrontmatter>,
) => {
  if (!slug || !title) return;
  const shouldAddResp = await enquirer.prompt({
    type: 'confirm',
    name: 'shouldAdd',
    message: `Do you want to add the book titled "${title}"?`,
    initial: true,
  });

  if (!shouldAddResp.shouldAdd) return;

  const fm: BookFrontmatter & { slug?: string } = {
    slug,
    title,
    subtitle,
    authors: contributions
      .filter((c) => c.contribution !== 'Narrator')
      .filter((c): c is typeof c & { author: { name: string } } => !!c.author?.name)
      .map(({ author: { name } }) => parseAuthor(name)),
    narrators: contributions
      .filter((c) => c.contribution === 'Narrator')
      .filter((c): c is typeof c & { author: { name: string } } => !!c.author?.name)
      .map(({ author: { name } }) => parseAuthor(name)),
    yearPublished: releaseDate ? dayjs.utc(releaseDate).year() : null,
    isbn10,
    isbn13,
    asin,
    coverImageUrl: editionImage || bookImage,
    hardcoverUrl: `https://hardcover.app/books/${slug}/editions/${editionId}`,
    series: series.length
      ? {
          name: series[0]!.series!.name,
          volume: series[0]!.position!,
        }
      : null,
    startedAt: null,
    finishedAt: null,
    rating: null,
    ...extraFields,
  };

  cli.info('How does this look?');
  cli.info(stringify(fm, null, 2));

  while (true) {
    const { editBook } = await enquirer.prompt({
      type: 'confirm',
      name: 'editBook',
      message: 'Do you want to edit this book?',
      initial: false,
    });
    if (!editBook) break;

    const { changeField } = await enquirer.prompt({
      type: 'select',
      name: 'changeField',
      message: 'Which field do you want to change?',
      choices: Object.keys(fm),
    });
    let { newValue } = await enquirer.prompt({
      type: 'input',
      name: 'newValue',
      message: `Enter new value for ${changeField}:`,
      initial: fm[changeField as keyof BookFrontmatter] ?? '',
    });
    if (newValue === fm[changeField as keyof BookFrontmatter] || !newValue?.trim()) {
      newValue = '';
    }
    const field = changeField as keyof BookFrontmatter | 'slug';
    switch (field) {
      case 'finishedAt':
      case 'startedAt':
        fm[field] = newValue ? dayjs.utc(newValue).toDate() : null;
        break;
      case 'rating': {
        const rating = newValue ? parseFloat(newValue) : null;
        if (rating !== null && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
          cli.error('Rating must be a number between 0 and 5');
          continue;
        }
        fm.rating = rating;
        break;
      }
      case 'authors':
      case 'narrators':
        fm[field] = newValue ? parseAuthors(newValue) : [];
        break;
      case 'series': {
        if (newValue) {
          const match = newValue.match(/^(.+?)(?:\s*#(\d+))?$/);
          if (match) {
            fm.series = {
              name: match[1]!.trim(),
              volume: match[2] ? parseInt(match[2], 10) : (fm.series?.volume ?? null),
            };
          } else {
            fm.series = null;
          }
        } else {
          fm.series = null;
        }
        break;
      }
      case 'yearPublished':
        fm.yearPublished = newValue ? parseInt(newValue, 10) : null;
        break;
      case 'title':
      case 'slug':
        if (!newValue) {
          cli.error(`The ${field} cannot be empty`);
          continue;
        }
        fm[field] = newValue;
        break;
      default:
        fm[field] = newValue || null;
    }

    cli.info('Updated book frontmatter:');
    cli.info(stringify(fm, null, 2));
  }

  const { slug: finalSlug } = fm;
  const fileName = resolve(dirname, '../../src/content/books', `${finalSlug!}.md${review?.spoilers ? 'x' : ''}`);
  const existingFile = ['', 'x'].find((end) =>
    existsSync(resolve(dirname, '../../src/content/books', `${finalSlug!}.md${end}`)),
  );
  delete fm.slug; // Remove slug from frontmatter, it will be used as the filename

  const { saveBook } = await enquirer.prompt({
    type: 'confirm',
    name: 'saveBook',
    message: `Do you want to save this book?${
      existingFile ? ` (this will overwrite the existing file at ${existingFile})` : ''
    }`,
    initial: true,
  });
  if (!saveBook) return;

  const output = `---\n${stringify(fm, null, 2).trim()}\n---${review?.spoilers ? "\n\nimport Spoiler from '~components/reading/Spoiler.astro';\n" : ''}\n${review?.slate ? slateToMd(review?.slate) : ''}\n`;
  const formatted = await prettier.format(output, {
    ...prettierRc,
    parser: 'markdown',
  });

  if (existingFile) await rm(existingFile);
  await writeFile(fileName, formatted, {
    flag: 'w',
    encoding: 'utf-8',
  });
  cli.info(`Book "${fm.title}" ${existingFile ? 'updated' : 'added'} successfully!`);
};

export default upsertBook;
