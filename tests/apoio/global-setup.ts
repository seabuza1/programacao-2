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

function sql(dbUrl: string, comando: string): string {
  return execFileSync('psql', [dbUrl, '-At', '-c', comando], { encoding: 'utf8' }).trim();
}

/**
 * Os testes cobrem o segundo fator exigido (o modo mais restrito). O piloto roda com ele
 * desligado (decisão 0008); tests/regras/segundo-fator.test.ts cobre esse modo.
 * Ao terminar, devolve a configuração que o banco local tinha.
 */
export default function setup(project: TestProject) {
  const ambiente = lerSupabaseLocal();
  project.provide('supabase', ambiente);
  const anterior = sql(
    ambiente.dbUrl,
    'select exigir_segundo_fator from public.configuracao_plataforma',
  );
  sql(ambiente.dbUrl, 'update public.configuracao_plataforma set exigir_segundo_fator = true');
  return () => {
    sql(
      ambiente.dbUrl,
      `update public.configuracao_plataforma set exigir_segundo_fator = ${anterior === 'f' ? 'false' : 'true'}`,
    );
  };
}
