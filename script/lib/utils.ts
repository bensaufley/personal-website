import type { HTMLElement } from 'node-html-parser';
import TurndownService from 'turndown';
import { gfm, strikethrough, tables } from 'turndown-plugin-gfm';

export const READ_BOOKS_PATH = '/books-read/bnsfly';
export const CURRENT_READING_PATH = '/currently-reading/bnsfly';
export const TO_READ_PATH = '/to-read/bnsfly';
export const SEARCH_PATH = '/search?search_term=%s';

export const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export const turndownService = new TurndownService();
turndownService.use([gfm, tables, strikethrough]);
turndownService
  .addRule('spoiler', {
    filter: (node) => node.classList.contains('spoiler'),
    replacement: (content) => `<Spoiler>${content}</Spoiler>`,
  })
  .addRule('lineBreak', {
    filter: 'br',
    replacement: () => '\n\n',
  });

export const parseName = (name: string) => {
  const nameParts = name.split(' ').filter(Boolean);
  return nameParts.length === 1
    ? { lastName: nameParts[0]! }
    : { firstName: nameParts[0]!, lastName: nameParts.slice(1).join(' ') };
};

/** It looks like node-html-parser isn't getting selected options via other
 * methods (select.value, option[selected]) so let's brute-force it */
export const getSelectValue = (select: HTMLElement | null): number | null => {
  if (!select) return null;
  const option = select.childNodes.find(
    (node) => (node as HTMLElement).getAttribute?.('selected') === 'selected',
  ) as HTMLElement | null;
  if (!option) return null;
  const value = option.getAttribute('value');
  return value ? Number(value) : null;
};

export const getDateFromForm = (form: HTMLElement, prefix: string): Date | null => {
  const year = getSelectValue(form.getElementById(`${prefix}_year`));
  if (!year) return null;

  const month = getSelectValue(form.getElementById(`${prefix}_month`));
  if (!month) return null;

  const day = getSelectValue(form.getElementById(`${prefix}_day`)) ?? 1;
  return new Date(Number(year), Number(month) - 1, Number(day));
};
