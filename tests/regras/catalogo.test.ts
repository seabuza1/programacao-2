/**
 * Guardas sobre o catálogo do Postgres: valem para toda tabela e função, inclusive as futuras.
 * Itens 4 e 13 da auditoria (docs/auditoria-seguranca.md).
 */
import { execFileSync } from 'node:child_process';
import { describe, expect, inject, it } from 'vitest';

function consultar(sql: string): string[] {
  const saida = execFileSync('psql', [inject('supabase').dbUrl, '-At', '-F', '|', '-c', sql], {
    encoding: 'utf8',
  });
  return saida.split('\n').filter(Boolean);
}

describe('catálogo do banco', () => {
  it('toda tabela de public tem RLS habilitado', () => {
    expect(
      consultar(`
        select c.relname from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
      `),
    ).toEqual([]);
  });

  it('anônimo não tem privilégio em tabela nem execução em função', () => {
    expect(
      consultar(`
        select table_name || ':' || privilege_type from information_schema.role_table_grants
        where grantee = 'anon' and table_schema = 'public'
      `),
    ).toEqual([]);
    expect(
      consultar(`
        select p.proname from pg_proc p
        where p.pronamespace = 'public'::regnamespace
          and has_function_privilege('anon', p.oid, 'execute')
      `),
    ).toEqual([]);
  });

  it('toda operação liberada para usuário logado tem policy correspondente', () => {
    // Para cada tabela e operação: ou authenticated não tem o privilégio, ou existe policy.
    expect(
      consultar(`
        with operacoes (op) as (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'))
        select c.relname || ':' || o.op
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        cross join operacoes o
        where n.nspname = 'public' and c.relkind = 'r'
          and (
            has_table_privilege('authenticated', c.oid, o.op)
            or (o.op in ('INSERT', 'UPDATE') and has_any_column_privilege('authenticated', c.oid, o.op))
          )
          and not exists (
            select 1 from pg_policies p
            where p.schemaname = 'public' and p.tablename = c.relname
              and (p.cmd = o.op or p.cmd = 'ALL')
              and ('authenticated' = any (p.roles) or 'public' = any (p.roles))
          )
      `),
    ).toEqual([]);
  });

  it('funções security definer fixam o search_path', () => {
    expect(
      consultar(`
        select p.proname from pg_proc p
        where p.pronamespace = 'public'::regnamespace and p.prosecdef
          and not exists (
            select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%'
          )
      `),
    ).toEqual([]);
  });

  it('nenhuma função monta SQL dinâmico com dado de entrada', () => {
    expect(
      consultar(`
        select p.proname from pg_proc p
        where p.pronamespace = 'public'::regnamespace and p.prolang = (select l.oid from pg_language l where l.lanname = 'plpgsql')
          and p.prosrc ilike '%execute %' and p.prosrc not ilike '%execute function%'
      `),
    ).toEqual([]);
  });
});
