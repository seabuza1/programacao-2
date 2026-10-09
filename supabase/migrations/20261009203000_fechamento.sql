-- Etapa 2.6: fechamento e reabertura de mês. A trava fica no banco.
-- Mês fechado não aceita insert, update nem delete nos lançamentos nem nos parâmetros do mês.
-- Saldos iniciais não mudam enquanto houver mês fechado.

create table public.meses_fechados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ano integer not null check (ano between 2000 and 2100),
  mes integer not null check (mes between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (empresa_id, ano, mes)
);
alter table public.meses_fechados enable row level security;

create trigger definir_metadados before insert or update on public.meses_fechados
for each row execute function public.definir_metadados();
create trigger impedir_troca_de_empresa before update on public.meses_fechados
for each row execute function public.impedir_troca_de_empresa();
create trigger registrar_auditoria after insert or update or delete on public.meses_fechados
for each row execute function public.registrar_auditoria();

-- Fechar e reabrir: admin e dono.
create policy meses_fechados_select on public.meses_fechados for select to authenticated
using (public.tem_acesso(empresa_id) and (select public.mfa_ok()));
create policy meses_fechados_insert on public.meses_fechados for insert to authenticated
with check (public.tem_papel(empresa_id, '{admin,dono}') and (select public.mfa_ok()));
create policy meses_fechados_delete on public.meses_fechados for delete to authenticated
using (public.tem_papel(empresa_id, '{admin,dono}') and (select public.mfa_ok()));
revoke update, truncate on public.meses_fechados from authenticated;

create function public.mes_fechado(p_empresa_id uuid, p_ano integer, p_mes integer) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.meses_fechados f
    where f.empresa_id = p_empresa_id and f.ano = p_ano and f.mes = p_mes
  );
$$;

-- Trava para tabelas com coluna `data`.
create function public.travar_mes_fechado_por_data() returns trigger
language plpgsql set search_path = '' as $$
begin
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

-- Trava para tabelas com colunas `ano` e `mes`.
create function public.travar_mes_fechado_por_mes() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and public.mes_fechado(old.empresa_id, old.ano, old.mes) then
    raise exception 'Mês fechado. Reabra o mês para alterar.' using errcode = 'P0001';
  end if;
  if tg_op in ('INSERT', 'UPDATE') and public.mes_fechado(new.empresa_id, new.ano, new.mes) then
    raise exception 'Mês fechado. Reabra o mês para alterar.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

create function public.travar_saldos_iniciais() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.meses_fechados f where f.empresa_id = coalesce(new.empresa_id, old.empresa_id)) then
    raise exception 'Há mês fechado. Reabra os meses para alterar os saldos iniciais.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

create trigger travar_mes_fechado before insert or update or delete on public.entradas_diarias
for each row execute function public.travar_mes_fechado_por_data();
create trigger travar_mes_fechado before insert or update or delete on public.indicadores_diarios
for each row execute function public.travar_mes_fechado_por_data();
create trigger travar_mes_fechado before insert or update or delete on public.movimentacoes
for each row execute function public.travar_mes_fechado_por_data();
create trigger travar_mes_fechado before insert or update or delete on public.parametros_mes
for each row execute function public.travar_mes_fechado_por_mes();
create trigger travar_saldos_iniciais before insert or update or delete on public.saldos_iniciais
for each row execute function public.travar_saldos_iniciais();
