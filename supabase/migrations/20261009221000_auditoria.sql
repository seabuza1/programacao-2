-- Fase 4.3 (auditoria, item 4): correções encontradas pela guarda do catálogo.
-- O Postgres dá EXECUTE ao PUBLIC em toda função nova. A revogação "in schema" da migration
-- inicial não tira esse padrão; só a forma global tira.
alter default privileges for role postgres revoke execute on functions from public;
revoke execute on all functions in schema public from public, anon;

-- mes_fechado é security definer (os gatilhos de trava precisam ler meses_fechados sem RLS).
-- Chamada direta só responde sobre empresa com vínculo; o servidor (sem usuário) continua lendo.
create or replace function public.mes_fechado(p_empresa_id uuid, p_ano integer, p_mes integer)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.meses_fechados f
    where f.empresa_id = p_empresa_id and f.ano = p_ano and f.mes = p_mes
  )
  and ((select auth.uid()) is null or public.tem_acesso(p_empresa_id));
$$;
