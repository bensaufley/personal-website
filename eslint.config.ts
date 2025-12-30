/* eslint-disable import/no-extraneous-dependencies */
import bslint from '@bensaufley/eslint-config';
import type { Linter } from 'eslint';
import astro from 'eslint-plugin-astro';
import { configs as mdx } from 'eslint-plugin-mdx';
import solid from 'eslint-plugin-solid/configs/typescript';

const config: Linter.Config[] = [
  {
    name: 'Global Ignores',
    ignores: ['.astro', 'node_modules', 'dist', 'src/components/Gtag.astro', '!.*.js', '!.*.cjs', '!.*.ts'],
  },
  ...bslint,
  {
    files: ['src/**/*.tsx', 'src/**/*.ts'],
    ...(solid as unknown as Linter.Config),
  },
  ...astro.configs['flat/recommended'],
  {
    rules: {
      'implicit-arrow-linebreak': 'off',
      'import/no-unresolved': ['error', { ignore: ['astro:content'] }],
    },
    languageOptions: {
      globals: {
        dataLayer: 'writable',
        gtag: 'writable',
        partytown: 'writable',
      },
    },
  },
  {
    files: ['*.mdx'],
    ...mdx.flat,
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      'import/prefer-default-export': 'off',

      // These rules generate false positives, unfortunately
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  mdx.flatCodeBlocks,
  {
    files: ['**/*.astro'],
    rules: {
      'import/prefer-default-export': 'off',
      // doesn't play nice with Astro
      'prettier/prettier': 'off',
    },
  },
  {
    files: ['script/**/*'],
    rules: {
      'no-console': 'off',
      'no-await-in-loop': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
];

export default config;
