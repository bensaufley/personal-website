import { RateLimiter } from 'limiter';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { type HTMLElement, parse } from 'node-html-parser';

const limiter = new RateLimiter({
  tokensPerInterval: 120,
  interval: 'minute',
});

export const getCsrfToken = async (doc: HTMLElement) => {
  const token = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (!token) throw new Error('Failed to find CSRF token in document.');
  return token;
};

export const rawReq = async (url: string | URL, options?: RequestInit) => {
  await limiter.removeTokens(1);

  const urlObj = typeof url === 'string' && url.startsWith('/') ? new URL(url, 'https://app.thestorygraph.com') : url;
  const cookies = await readFile(resolve(import.meta.dirname, '../../.storygraph-cookies'));
  if (!cookies) throw new Error('Failed to read StoryGraph cookies.');

  const resp = await fetch(urlObj, {
    ...options,
    headers: { ...options?.headers, Cookie: cookies.toString(), 'x-requested-with': 'XMLHttpRequest' },
  });
  if (!resp.ok) {
    const body = await resp.text();
    console.error(body);
    console.error({ headers: Object.fromEntries([...resp.headers.entries()]) });
    throw new Error(
      `Failed to fetch URL ${options?.method?.toUpperCase() ?? 'GET'}#${urlObj.toString()} from The StoryGraph: ${resp.status}`,
    );
  }
  return resp;
};

export const req = async (url: string | URL, options?: RequestInit) => {
  const resp = await rawReq(url, options);
  const html = await resp.text();
  return parse(html);
};
