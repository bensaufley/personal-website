import Enquirer from 'enquirer';
import { extension } from 'mime-types';
import { glob, rm, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { styleText } from 'node:util';
import { parse } from 'node-html-parser';

import type { BookFrontmatter } from '~content/config';

import { getBook } from './build-db';
import { rawReq, req } from './tsg-req';
import { getDateFromForm, parseName, turndownService, UUID_REGEX } from './utils';

const enquirer = new Enquirer<{
  format?: 'digital' | 'paperback' | 'audio' | 'hardcover' | 'cancel';
  importCurrent?: boolean;
  overwriteCover?: boolean;
  addToShelf?: 'to-read' | 'read' | 'currently-reading' | 'none' | 'cancel';
}>();

export type ProcessedTsgBook = BookFrontmatter & { slug: string; review: string | null; hasSpoilers: boolean };

export const processTsgBook = async (path: string, force = false): Promise<ProcessedTsgBook> => {
  const id = path.match(UUID_REGEX)?.[0];
  if (!id) throw new Error('Could not infer id from path');

  const bookUrl = new URL(path, 'https://app.thestorygraph.com');
  const doc = await req(path);
  if (doc.querySelector('a[href^="/edit-read-instance-from-book"]') || force) {
    const rawTitle = doc.querySelector('.book-title-author-and-series h3')?.textContent.trim();
    if (!rawTitle) throw new Error(`Could not find title at ${bookUrl.toString()}`);

    const [titlePart, ...otherTitles] = rawTitle.split(': ').filter(Boolean) as [string, ...string[]];
    const title = titlePart.split('\n')[0]?.trim() || '';
    const subtitle = otherTitles.join(': ').split('\n')[0] || null;

    let series: { name: string; volume: number | null } | null = null;
    const seriesElement = doc.querySelectorAll('.book-title-author-and-series p:first-child a[href^="/series/"]');
    if (seriesElement[0]?.textContent?.trim()) {
      const rawVolume = seriesElement[1]?.textContent?.trim().replace(/^\D/, '');
      const volume = Number(rawVolume);
      series = {
        name: seriesElement[0]!.textContent!.trim(),
        volume: Number.isNaN(volume) ? null : volume,
      };
    }

    const slug = title
      .toLocaleLowerCase()
      .replaceAll(/'/g, '')
      .replaceAll(/[^a-z0-9]+/g, '-');

    const existingBook = getBook(slug);

    const contributors = doc.querySelector('.book-title-author-and-series p')?.textContent.trim();
    const [rawAuthors, rawOthers] = contributors?.split(' with ') ?? [];
    if (!rawAuthors) throw new Error(`Could not find authors at ${bookUrl.toString()}`);
    const authors = rawAuthors
      .split(',')
      .map((author) => author.trim())
      .filter(Boolean)
      .map(parseName);
    const narrators = rawOthers
      ?.split(', ')
      .map((narrator) => narrator.trim())
      .filter((narrator) => narrator && narrator.endsWith('(Narrator)'))
      .map((narrator) => parseName(narrator.replace('(Narrator)', '').trim()));

    const imageSrc = doc.querySelector('.book-cover img')?.getAttribute('src');
    let coverImage: string | null = null;
    if (imageSrc) {
      const img = await rawReq(imageSrc);
      const mimeType = img.headers.get('content-type');
      const ext = mimeType ? extension(mimeType) : extname(imageSrc) || 'jpg';
      coverImage = `${slug}.${ext}`;
      const { value: existingCover } = await glob(resolve(import.meta.dirname, '../../covers', `${slug}.*`)).next();
      let write = !existingCover;
      if (existingCover) {
        const result = await enquirer.prompt({
          type: 'confirm',
          name: 'overwriteCover',
          message: `Cover image for "${title}" already exists. Overwrite?`,
          initial: false,
        });
        write = !!result.overwriteCover;
        if (!write) coverImage = basename(existingCover);
      }
      if (write) {
        if (existingCover) await rm(existingCover);
        await writeFile(resolve(import.meta.dirname, '../../covers', coverImage), Buffer.from(await img.arrayBuffer()));
      }
    }

    const editionInfo = doc.querySelectorAll('.edition-info p');
    const rawPublished = doc
      .querySelector('.book-title-author-and-series + p')
      ?.textContent.match(/first pub (?<year>\d{4})/i)?.groups?.year;
    const isbn = editionInfo
      .find((el) => Array.from(el.childNodes).some((node) => node.textContent?.includes('ISBN')))
      ?.childNodes.find((node) => !Number.isNaN(Number(node.textContent ?? '')));

    const sharedFrontmatter: ProcessedTsgBook = {
      asin: existingBook?.asin ?? null,
      authors,
      coverImage,
      finishedAt: existingBook?.finishedAt ?? null,
      hardcoverUrl: existingBook?.hardcoverUrl ?? null,
      hasSpoilers: false,
      isbn10: isbn?.textContent?.length === 10 ? isbn.textContent : null,
      isbn13: isbn?.textContent?.length === 13 ? isbn.textContent : null,
      narrators,
      rating: null,
      review: null,
      series,
      slug,
      startedAt: existingBook?.startedAt ?? null,
      storygraphId: id,
      subtitle,
      title,
      yearPublished: rawPublished ? Number(rawPublished) : null,
    };

    const readStatus = doc
      .querySelector('.on-book-page.action-menu .read-status-label')
      ?.textContent.toLocaleLowerCase();

    switch (readStatus) {
      case 'read':
      case 'currently reading': {
        const rating = doc
          .querySelectorAll('.on-book-page.action-menu .book-page-review-section span')
          .find((el) => !Number.isNaN(Number(el.textContent?.trim() ?? '')));
        const editReadDatesLink = doc.querySelector(
          '.on-book-page.action-menu a[href^="/edit-read-instance-from-book"]',
        );
        const editReadDatesUrl = editReadDatesLink?.getAttribute('href') ?? null;
        let startedAt: Date | null = null;
        let finishedAt: Date | null = null;
        if (editReadDatesUrl) {
          const fragment = await req(editReadDatesUrl);
          startedAt = getDateFromForm(fragment, 'read_instance_start');
          finishedAt = getDateFromForm(fragment, 'read_instance');
        }
        let review: string | null = null;
        let hasSpoilers: boolean = false;
        if (readStatus === 'read') {
          const reviewUrl =
            doc.querySelector('.on-book-page.action-menu a[href^="/reviews/"]')?.getAttribute('href') ?? null;
          if (reviewUrl) {
            const reviewDoc = await req(reviewUrl);
            const rawReview = reviewDoc.querySelector('.review-explanation > div')?.innerHTML.trim() ?? null;
            review = rawReview ? turndownService.turndown(rawReview) : null;
            hasSpoilers = !!reviewDoc.querySelector('.spoiler');
          }
        }
        return {
          ...sharedFrontmatter,
          rating: rating ? Number(rating.textContent!.trim()) : null,
          startedAt,
          finishedAt,
          review,
          hasSpoilers,
        };
      }
      case 'to read':
        return sharedFrontmatter;
      default:
        // Not on any lists
        throw new Error(`Unknown read status: ${readStatus}`);
    }
  } else {
    const readLink = doc
      .querySelectorAll('a[href^="/books/"]')
      .find((el) => /You.* another edition/gi.test(el.textContent ?? ''));
    if (readLink) return processTsgBook(readLink.getAttribute('href')!, true);

    const { format } = await enquirer.prompt({
      type: 'select',
      name: 'format',
      message: 'This book is not already in your StoryGraph library. Select the format to import:',
      choices: [
        { name: 'audio', message: 'Audio' },
        { name: 'paperback', message: 'Paperback' },
        { name: 'hardcover', message: 'Hardcover' },
        { name: 'digital', message: 'Digital' },
        { name: 'cancel', message: 'Cancel', hint: 'Do not import book' },
      ],
    });
    if (format === 'cancel') throw new Error('Import canceled by user.');

    const filtered = await rawReq(
      `/filter-editions?format_${format}=true&book_id=${encodeURIComponent(id)}&commit=Filter`,
    );
    const raw = await filtered.text();
    const fragment = raw.match(/\$\('.filtered-search-results-books-panes'\)\.append\((".+?")\);$/m)?.[1] ?? '';
    const parsedFragment = fragment.replaceAll(/\\n/g, '\n').replaceAll(/\\(?!\\)/g, '');
    const synthesizedDom = `<html><head></head><body>${parsedFragment}</body></html>`;
    const filteredHtml = parse(synthesizedDom);
    const firstBookPane = filteredHtml
      .querySelectorAll('.book-pane-content')
      .filter((el) => /Language:\s*English/.test(el.textContent ?? ''))
      .find((el) => (format === 'audio' ? /\(Narrator\)/.test(el.textContent ?? '') : true));
    const bookLink = firstBookPane?.querySelector('a[href^="/books/"]')?.getAttribute('href');
    if (bookLink) {
      const result = await enquirer.prompt({
        type: 'select',
        name: 'addToShelf',
        message: `Do you want to add ${styleText(['underline', 'blue'], `https://app.thestorygraph.com/${bookLink}`)} to a shelf?`,
        choices: [
          { name: 'to-read', message: 'To Read' },
          { name: 'read', message: 'Read' },
          { name: 'currently-reading', message: 'Currently Reading' },
          { name: 'none', message: 'Do Not Add', hint: 'Do not add this book to any shelf' },
          { name: 'cancel', message: 'Cancel Import', hint: 'End the import process' },
        ],
      });
      if (!['none', 'cancel'].includes(result.addToShelf!)) {
        await rawReq(`/update-status.js?book_id=${encodeURIComponent(id)}&status=${result.addToShelf}`);
      }
      if (result.addToShelf === 'cancel') throw new Error('Import canceled by user.');
      return processTsgBook(bookLink, true);
    }

    console.warn(`${styleText(['dim', 'yellow'], 'Warning:')} No suitable ${format} edition found.`);
    const result = await enquirer.prompt({
      type: 'confirm',
      name: 'importCurrent',
      message: `Do you want to import ${styleText(['underline', 'blue'], `https://app.thestorygraph.com/${path}`)} anyway?`,
      initial: false,
    });
    if (!result.importCurrent) throw new Error(`Aborted by user due to no suitable ${format} edition.`);
    return processTsgBook(path, true);
  }
};
