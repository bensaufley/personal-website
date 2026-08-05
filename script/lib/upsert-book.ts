import { confirm, input, select } from '@inquirer/prompts';
import { diffWords } from 'diff';
import { glob, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { type InspectColor, styleText } from 'node:util';
import { x } from 'tinyexec';
import { parse, stringify } from 'yaml';

import type { BookFrontmatter } from '~content/config';

import { getBookBySlug } from './build-db';
import { type ProcessedTsgBook, processTsgBook } from './process-tsg-book';
import { dayjs, debug } from './utils';

const contentDir = resolve(import.meta.dirname, '../../src/content/books');

const standardize = (frontmatter: BookFrontmatter, review: string | null | undefined) => `---
${stringify(
  Object.fromEntries(
    Object.entries({
      ...frontmatter,
      startedAt: frontmatter.startedAt ? dayjs.utc(frontmatter.startedAt).format('YYYY-MM-DD') : null,
      finishedAt: frontmatter.finishedAt ? dayjs.utc(frontmatter.finishedAt).format('YYYY-MM-DD') : null,
      authors: frontmatter.authors.map(({ lastName, firstName }) => ({ lastName, firstName })),
      narrators: frontmatter.narrators?.map(({ lastName, firstName }) => ({ lastName, firstName })) ?? null,
      series: frontmatter.series ? { name: frontmatter.series.name, volume: frontmatter.series.volume } : null,
    }).sort(([a], [b]) => a.localeCompare(b)),
  ),
)}---
${review?.includes('<Spoiler>') ? "\nimport Spoiler from '~components/reading/Spoiler.astro';\n" : ''}${review?.trim() ? `\n${review}\n` : ''}`;

const toSentence = (arr: string[]) =>
  arr.length === 1 ? arr[0] : `${arr.slice(0, -1).join(', ')}${arr.length > 2 ? ',' : ''} and ${arr.at(-1)}`;

export const upsertBook = async (inputValue: string | ProcessedTsgBook) => {
  const processed = typeof inputValue === 'string' ? await processTsgBook(inputValue) : inputValue;
  const { slug: processedSlug, review, hasSpoilers, ...frontmatter } = processed;

  const newContent = standardize(frontmatter, review);

  let slug = processedSlug;
  while (true) {
    const globPath = resolve(contentDir, `${slug}.{md,mdx}`);
    debug('Checking for existing file at ', globPath);
    const existingFilesGlob = glob(globPath);
    const existingFiles: string[] = [];
    for await (const f of existingFilesGlob) {
      existingFiles.push(f);
    }
    const filename = `${slug}.md${hasSpoilers ? 'x' : ''}`;

    const saveToFile = async () => {
      const fullPath = resolve(contentDir, filename);
      await writeFile(fullPath, newContent, 'utf-8');
      await x('npm', ['run', 'format:es', '--', fullPath], { throwOnError: true }).then(null, (error) => {
        console.warn('Formatting failed for file:', fullPath, error.message);
      });
    };

    if (existingFiles.length) {
      const existingContent = await readFile(existingFiles.at(-1)!, 'utf-8');
      const [, fmRaw, review] = existingContent.split('---');
      const existingStandardized = standardize(parse(fmRaw!) as BookFrontmatter, review);
      const diff = diffWords(existingStandardized, newContent);

      // No changes
      if (diff.length === 1 && !diff[0]?.added && !diff[0]?.removed) {
        console.log(`No changes for book "${processed.title}"`);
        return processed;
      }

      const existingBookData = getBookBySlug(slug);

      const conflictResolveStrategy = await select({
        message: `A file exists at ${basename(existingFiles.at(-1)!)}${existingBookData ? ` for the book "${existingBookData.title}" by ${toSentence(existingBookData?.authors.map(({ firstName, lastName }) => [firstName, lastName].filter(Boolean).join(' ')))}` : ''}.`,
        choices: ['Overwrite', 'See Diff', 'Change Slug', 'Skip Import'],
      });

      if (conflictResolveStrategy === 'Change Slug') {
        slug = await input({ message: 'Enter a new slug:', prefill: 'editable', default: slug });
        continue;
      }

      diff.forEach((part) => {
        process.stdout.write(
          styleText(
            ([part.added && 'green', part.removed && 'bgRedBright'] satisfies (InspectColor | false)[]).filter(
              (v) => !!v,
            ),
            part.value,
          ),
        );
      });
      console.log();

      if (conflictResolveStrategy === 'See Diff') continue;
      if (conflictResolveStrategy === 'Skip Import') return processed;

      const save = await confirm({
        message: `Overwrite existing file "${existingFiles.at(-1)}"?`,
        default: true,
      });
      if (!save) return processed;

      for (const existingFile of existingFiles) {
        await rm(existingFile);
      }
      await saveToFile();
      return processed;
    }

    console.log(`New Book:\n\n${newContent}\n\n`);
    const save = await confirm({
      message: `Save new file as "${filename}"?`,
      default: true,
    });
    if (save) await saveToFile();
    return processed;
  }
};
