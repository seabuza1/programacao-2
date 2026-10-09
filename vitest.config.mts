import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        resolve: {
          alias: {
            'server-only': fileURLToPath(new URL('./tests/apoio/vazio.ts', import.meta.url)),
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts', 'tests/dominio/**/*.test.ts'],
        },
      },
      {
        // Contra o Supabase local: `pnpm supabase start` antes.
        extends: true,
        test: {
          name: 'db',
          environment: 'node',
          include: ['tests/isolamento/**/*.test.ts', 'tests/regras/**/*.test.ts'],
          globalSetup: ['tests/apoio/global-setup.ts'],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
