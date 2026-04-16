import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: null,
  buildCommand: null,
  outputDirectory: '.',
  functions: {
    'api/**/*.js': {
      maxDuration: 60,
    },
  },
};

export default config;
