import { diffWords } from 'diff';
import Enquirer from 'enquirer';
import { glob, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { type InspectColor, styleText } from 'node:util';
import { parse, stringify } from 'yaml';

import type { BookFrontmatter } from '~content/config';

import { type ProcessedTsgBook, processTsgBook } from './process-tsg-book';

const contentDir = resolve(import.meta.dirname, '../../src/content/books');

const standardize = (frontmatter: BookFrontmatter, review: string | null | undefined) => `---
${stringify(
  Object.fromEntries(
    Object.entries({
      ...frontmatter,
      authors: frontmatter.authors.map(({ lastName, firstName }) => ({ lastName, firstName })),
      narrators: frontmatter.narrators?.map(({ lastName, firstName }) => ({ lastName, firstName })) ?? null,
      series: frontmatter.series ? { name: frontmatter.series.name, volume: frontmatter.series.volume } : null,
    }).sort(([a], [b]) => a.localeCompare(b)),
  ),
)}---
${review?.trim() ? `\n${review}\n` : ''}`;

export const upsertBook = async (input: string | ProcessedTsgBook) => {
  const processed = typeof input === 'string' ? await processTsgBook(input) : input;
  const { slug, review, hasSpoilers, ...frontmatter } = processed;

  const newContent = standardize(frontmatter, review);

  const globPath = resolve(contentDir, `${slug}.{md,mdx}`);
  console.debug('Checking for existing file at ', globPath);
  const existingFilesGlob = glob(globPath);
  const existingFiles: string[] = [];
  for await (const f of existingFilesGlob) {
    existingFiles.push(f);
  }
  const filename = `${slug}.md${hasSpoilers ? 'x' : ''}`;

  const enquirer = new Enquirer<{
    save?: boolean;
  }>();

  if (existingFiles.length) {
    const existingContent = await readFile(existingFiles.at(-1)!, 'utf-8');
    const [, fmRaw, review] = existingContent.split('---');
    const existingStandardized = standardize(parse(fmRaw!) as BookFrontmatter, review);
    const diff = diffWords(existingStandardized, newContent);
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
    const response = await enquirer.prompt({
      type: 'confirm',
      name: 'save',
      message: `Overwrite existing file "${existingFiles.at(-1)}"?`,
      initial: false,
    });
    if (!response.save) return processed;

    for (const existingFile of existingFiles) {
      await rm(existingFile);
    }
    await writeFile(resolve(contentDir, filename), newContent, 'utf-8');
  } else {
    console.log(`New Book:\n\n${newContent}\n\n`);
    const response = await enquirer.prompt({
      type: 'confirm',
      name: 'save',
      message: `Save new file as "${filename}"?`,
      initial: true,
    });
    if (response.save) await writeFile(resolve(contentDir, filename), newContent, 'utf-8');
  }

  return processed;
};
