import type { CollectionConfig } from 'astro/content/config';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      headerImage: image().optional(),
      headerImageAlt: z.string().optional(),
      summary: z.string().optional(),
      preview: z.string().optional(),
    }),
});

const personSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string(),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().nullable(),
    authors: z.array(personSchema),
    narrators: z.array(personSchema).nullable().optional(),
    yearPublished: z.number().nullable(),
    isbn10: z.string().nullable(),
    isbn13: z.string().nullable(),
    asin: z.string().nullable(),
    coverImageUrl: z.url().nullable().optional(),
    hardcoverUrl: z.url().nullable().optional(),
    series: z
      .object({
        name: z.string(),
        volume: z.number().nullable(),
      })
      .optional()
      .nullable(),
    finishedAt: z.coerce.date().nullable(),
    startedAt: z.coerce.date().nullable(),
    rating: z.number().min(0).max(5).nullable(),
  }),
});

type InferCollectionSchema<T extends CollectionConfig<any>> = T extends CollectionConfig<infer U> ? z.infer<U> : never;

export type BookFrontmatter = InferCollectionSchema<typeof books>;
export type PostFrontmatter = InferCollectionSchema<typeof posts>;
export type Person = z.infer<typeof personSchema>;

export const collections = { books, posts };
