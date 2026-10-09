import { execFileSync } from 'node:child_process';
import type { TestProject } from 'vitest/node';

export interface AmbienteSupabase {
  url: string;
  publishableKey: string;
  secretKey: string;
  dbUrl: string;
}

declare module 'vitest' {
  export interface ProvidedContext {
    supabase: AmbienteSupabase;
  }
}

// Chaves do Supabase local (públicas e iguais em toda instalação local).
function lerSupabaseLocal(): AmbienteSupabase {
  const saida = execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const status = JSON.parse(saida) as Record<string, string | undefined>;
  const {
    API_URL: url,
    PUBLISHABLE_KEY: publishableKey,
    SECRET_KEY: secretKey,
    DB_URL: dbUrl,
  } = status;
  if (!url || !publishableKey || !secretKey || !dbUrl) {
    throw new Error('Supabase local não está rodando. Rode `pnpm supabase start`.');
  }
  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) {
    throw new Error('Os testes de banco só rodam contra o Supabase local.');
  }
  return { url, publishableKey, secretKey, dbUrl };
}

export default function setup(project: TestProject) {
  project.provide('supabase', lerSupabaseLocal());
}
