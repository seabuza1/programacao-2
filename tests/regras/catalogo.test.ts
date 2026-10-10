/**
 * Guardas sobre o catálogo do Postgres: valem para toda tabela e função, inclusive as futuras.
 * Itens 4 e 13 da auditoria (docs/auditoria-seguranca.md).
 */
import { execFileSync } from 'node:child_process';
import { describe, expect, inject, it } from 'vitest';
import { TABELAS_DA_EMPRESA } from '@/features/lgpd/service';

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

  it('usuário logado não tem TRUNCATE, TRIGGER, REFERENCES nem MAINTAIN em tabela nenhuma', () => {
    // TRUNCATE ignora RLS e gatilhos de linha (trava de mês fechado, auditoria).
    expect(
      consultar(`
        select c.relname || ':' || p.op
        from pg_class c
        cross join (values ('TRUNCATE'), ('TRIGGER'), ('REFERENCES'), ('MAINTAIN')) p (op)
        where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
          and has_table_privilege('authenticated', c.oid, p.op)
      `),
    ).toEqual([]);
    // Nem nas tabelas que vierem depois.
    expect(
      consultar(`
        select a.privilege_type
        from pg_default_acl d, aclexplode(d.defaclacl) a
        where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 'public'::regnamespace
          and d.defaclobjtype = 'r' and a.grantee = 'authenticated'::regrole
          and a.privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES', 'MAINTAIN')
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

  it('toda tabela com empresa_id entra na exportação e na exclusão (LGPD)', () => {
    const comEmpresa = consultar(`
      select c.table_name from information_schema.columns c
      join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
      where c.table_schema = 'public' and c.column_name = 'empresa_id' and t.table_type = 'BASE TABLE'
      order by c.table_name
    `);
    expect(comEmpresa).toEqual([...TABELAS_DA_EMPRESA].sort());
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
