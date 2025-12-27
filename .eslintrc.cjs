// @ts-check

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@bensaufley', 'plugin:astro/recommended'],
  rules: {
    'implicit-arrow-linebreak': 'off',
    'import/no-unresolved': ['error', { ignore: ['astro:content'] }],
  },
  globals: {
    dataLayer: 'writable',
    gtag: 'writable',
    partytown: 'writable',
  },
  overrides: [
    {
      files: ['*.mdx'],
      plugins: ['mdx'],
      extends: ['plugin:mdx/recommended'],
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.mdx'],
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'off',
        'import/prefer-default-export': 'off',

        // These rules generate false positives, unfortunately
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
      plugins: ['astro'],
      rules: {
        'import/prefer-default-export': 'off',
        // doesn't play nice with Astro
        'prettier/prettier': 'off',
      },
    },
    {
      files: ['script/*'],
      rules: {
        'no-console': 'off',
        'no-await-in-loop': 'off',
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
