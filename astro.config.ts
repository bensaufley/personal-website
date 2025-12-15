/// <reference types="astro/astro-jsx" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-solid-svg/types" />

/* eslint-disable import/no-extraneous-dependencies */
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import solid from '@astrojs/solid-js';
import { defineConfig } from 'astro/config';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import { resolve } from 'node:path';
import solidSvg from 'vite-plugin-solid-svg';

import { getLastMods, type LastMods } from './getLatestChanged.js';
import externalLinksPlugin from './src/shared/externalLinksPlugin.js';

dayjs.extend(minMax);

let lastMods: LastMods;

export default defineConfig({
  markdown: {
    rehypePlugins: [externalLinksPlugin],
  },
  integrations: [
    solid({ devtools: true }),
    mdx({
      rehypePlugins: [externalLinksPlugin],
    }),
    sitemap({
      serialize: async (entry) => {
        // To only run this calculation once, but not call it if `serialize` isn't called
        if (!lastMods) lastMods = await getLastMods();

        const { latestSharedChange, latestBlogEntryChange, blogPostUpdates, latestReadingEntryChange } = lastMods;
        switch (new URL(entry.url).pathname.match(/^\/[^/]*/)?.[0]) {
          case '/':
          case '/blog': {
            const pathname = new URL(entry.url).pathname.replace(/\/$/, '');
            if (pathname in blogPostUpdates) {
              return {
                ...entry,
                lastmod: dayjs.max(blogPostUpdates[pathname]!, latestSharedChange).toISOString(),
              };
            }
            return {
              ...entry,
              lastmod: dayjs.max(latestBlogEntryChange, latestSharedChange).toISOString(),
            };
          }
          case '/reading': {
            const pathname = new URL(entry.url).pathname.replace(/\/$/, '');
            if (pathname in blogPostUpdates) {
              return {
                ...entry,
                lastmod: dayjs.max(blogPostUpdates[pathname]!, latestSharedChange).toISOString(),
              };
            }
            return {
              ...entry,
              lastmod: dayjs.max(latestReadingEntryChange, latestSharedChange).toISOString(),
            };
          }
          default:
            // get latest modified on main branch
            return { ...entry, lastmod: latestSharedChange.toISOString() };
        }
      },
    }),
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
  site: 'https://bensaufley.com',
  vite: {
    resolve: {
      alias: {
        '~components': resolve('./src/components'),
        '~content': resolve('./src/content'),
        '~lib': resolve('./src/lib'),
        '~layouts': resolve('./src/layouts'),
        '~pages': resolve('./src/pages'),
      },
    },
    plugins: [
      solidSvg({
        defaultAsComponent: false,
      }) as any,
    ],
  },
  output: 'static',
  redirects: {
    '/blog': '/',
    '/blog/0': '/',
    '/reading/0': '/reading',
    '/blog/2025/01/2025-01-29--on-dei': '/blog/2025/01/on-dei',
    '/blog/2025/04/2025-04-19-the-marketplace-of-ideas': '/blog/2025/04/the-marketplace-of-ideas',
  },
});
