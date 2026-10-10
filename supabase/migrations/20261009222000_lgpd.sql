-- Fase 4.4 (LGPD): exclusão completa de uma empresa, com confirmação.
-- As travas (auditoria só insert, mês fechado, item padrão) abrem exceção só dentro de
-- excluir_empresa, e só para a empresa em exclusão (configuração local à transação).

create function public.excluindo_empresa(p_empresa_id uuid) returns boolean
language sql stable set search_path = '' as $$
  select coalesce(current_setting('app.excluindo_empresa', true), '') = p_empresa_id::text;
$$;

create or replace function public.impedir_alteracao_auditoria() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and public.excluindo_empresa(old.empresa_id) then
    return old;
  end if;
  raise exception 'auditoria só aceita insert' using errcode = '42501';
end $$;

-- Na exclusão da empresa, nada é auditado (a própria auditoria da empresa vai embora).
create or replace function public.registrar_auditoria() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_antes jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_depois jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_linha jsonb := coalesce(v_depois, v_antes);
  v_empresa_id uuid := case when tg_table_name = 'empresas' then (v_linha ->> 'id')::uuid
                            else (v_linha ->> 'empresa_id')::uuid end;
begin
  if public.excluindo_empresa(v_empresa_id) then
    return null;
  end if;
  insert into public.auditoria (empresa_id, tabela, registro_id, operacao, antes, depois, created_by)
  values (v_empresa_id, tg_table_name, (v_linha ->> 'id')::uuid, tg_op, v_antes, v_depois, (select auth.uid()));
  return null;
end $$;

create or replace function public.proteger_item_padrao() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and old.padrao and not public.excluindo_empresa(old.empresa_id) then
    raise exception 'Item padrão não pode ser apagado. Desative-o.' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and old.padrao and new.nome is distinct from old.nome then
    raise exception 'Item padrão não pode ser renomeado.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

create or replace function public.travar_mes_fechado_por_data() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and public.excluindo_empresa(old.empresa_id) then
    return old;
  end if;
  if tg_op in ('UPDATE', 'DELETE') and public.mes_fechado(
    old.empresa_id, extract(year from old.data)::integer, extract(month from old.data)::integer
  ) then
    raise exception 'Mês fechado. Reabra o mês para alterar.' using errcode = 'P0001';
  end if;
  if tg_op in ('INSERT', 'UPDATE') and public.mes_fechado(
    new.empresa_id, extract(year from new.data)::integer, extract(month from new.data)::integer
  ) then
    raise exception 'Mês fechado. Reabra o mês para alterar.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

create or replace function public.travar_mes_fechado_por_mes() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and public.excluindo_empresa(old.empresa_id) then
    return old;
  end if;
  if tg_op in ('UPDATE', 'DELETE') and public.mes_fechado(old.empresa_id, old.ano, old.mes) then
    raise exception 'Mês fechado. Reabra o mês para alterar.' using errcode = 'P0001';
  end if;
  if tg_op in ('INSERT', 'UPDATE') and public.mes_fechado(new.empresa_id, new.ano, new.mes) then
    raise exception 'Mês fechado. Reabra o mês para alterar.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

create or replace function public.travar_saldos_iniciais() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_empresa_id uuid := coalesce(new.empresa_id, old.empresa_id);
begin
  if tg_op = 'DELETE' and public.excluindo_empresa(v_empresa_id) then
    return old;
  end if;
  if exists (select 1 from public.meses_fechados f where f.empresa_id = v_empresa_id) then
    raise exception 'Há mês fechado. Reabra os meses para alterar os saldos iniciais.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

-- Exclui a empresa e tudo dela. Mesma checagem do convite (admin da plataforma com vínculo
-- admin e segundo fator) e confirmação com o nome exato. Devolve os usuários que ficaram sem
-- nenhum vínculo, para o servidor apagar as contas (dado pessoal) no Auth.
create function public.excluir_empresa(p_empresa_id uuid, p_confirmacao text)
returns setof uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_nome text;
begin
  if not public.pode_convidar(p_empresa_id) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  select e.nome into v_nome from public.empresas e where e.id = p_empresa_id;
  if v_nome is null or btrim(coalesce(p_confirmacao, '')) <> v_nome then
    raise exception 'Confirmação não confere. Digite o nome exato da empresa.' using errcode = 'P0001';
  end if;
  return query
    select v.usuario_id
    from public.vinculos v
    join public.usuarios u on u.id = v.usuario_id
    where v.empresa_id = p_empresa_id
      and not u.admin_plataforma
      and not exists (
        select 1 from public.vinculos o where o.usuario_id = v.usuario_id and o.empresa_id <> p_empresa_id
      );
  perform set_config('app.excluindo_empresa', p_empresa_id::text, true);
  delete from public.empresas where id = p_empresa_id;
end $$;

revoke execute on function public.excluindo_empresa(uuid) from public, anon;
revoke execute on function public.excluir_empresa(uuid, text) from public, anon;
