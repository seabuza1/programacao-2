import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// CLAUDE.md: dependência em um sentido (app → features → lib) e
// uma feature só importa outra pelo index.ts dela.
const featurePorDentro = {
  group: ['@/features/*/*'],
  message: 'Importe a feature pelo index.ts dela: @/features/<dominio>.',
};
const app = { group: ['@/app', '@/app/*'], message: 'Só app importa de app.' };
const features = { group: ['@/features', '@/features/*'], message: 'lib não importa de features.' };

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts']),
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [featurePorDentro] }] },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [featurePorDentro, app] }] },
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [features, app] }] },
  },
]);
