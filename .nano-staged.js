// @ts-check

/**
 * @typedef {{
 *   filenames: string[];
 *   type: 'staged' | 'unstaged' | 'diff';
 * }} NanoStagedAPI
 *
 * @typedef {(api: NanoStagedAPI) => string[] | string} GenerateTask
 */

/** @type {GenerateTask} */
const handleAstro = (api) => [
  `npm run format:es -- ${api.filenames.join(' ')}`,
  // Just run astro check on whole application;
  // it does not support single file checking.
  'npm run lint:astro',
];

/** @type {GenerateTask} */
const handleJsTs = (api) => [
  `npm run format:es -- ${api.filenames.join(' ')}`,
  // Just run typechecking on whole application;
  // it does not support single file checking.
  'npm run typecheck',
];

/** @type {Record<string, GenerateTask | string | string[]>} */
const config = {
  '**/*.mdx': ['npm run format:es'],
  '**/*.{astro,json,md}': ['npx prettier --write'],
  '**/*.astro': handleAstro,
  '**/*.{js,cjs,ts,tsx}': handleJsTs,
  '**/*.css': ['npm run format:css', 'npx prettier --write'],
};

export default config;
