import type { CodegenConfig } from '@graphql-codegen/cli';
import { execSync } from 'child_process';

import { getToken } from './script/lib/utils';

const apiKey = await getToken();

const config: CodegenConfig = {
  schema: {
    'https://api.hardcover.app/v1/graphql': {
      headers: {
        Authorization: apiKey,
      },
    },
  },
  documents: './script/graphql/**/*.graphql',
  generates: {
    './script/lib/graphql-operations.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
  },
  hooks: {
    afterAllFileWrite: (...args) => {
      process.stdout.write('Formatting generated GraphQL operations... ');
      execSync(`npm run format:es -- ${args.map((p) => JSON.stringify(p)).join(' ')}`);
      process.stdout.write('done.\n');
    },
  },
};

export default config;
