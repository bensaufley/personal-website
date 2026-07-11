import { RateLimiter } from 'limiter';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'node-html-parser';

const limiter = new RateLimiter({
  tokensPerInterval: 120,
  interval: 'minute',
});

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
    throw new Error(`Failed to fetch data from The StoryGraph: ${resp.status}`);
  }
  return resp;
};

export const req = async (url: string | URL, options?: RequestInit) => {
  const resp = await rawReq(url, options);
  const html = await resp.text();
  return parse(html);
};
