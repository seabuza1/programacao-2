-- Fase 3: painel da administradora, anotações e gestão de vínculos.

-- Setor da empresa (alerta de margem fora da faixa) -------------------------
alter table public.empresas
  add column setor text check (setor in ('servicos', 'comercio', 'industria'));
grant update (setor) on public.empresas to authenticated;

-- Anotações por empresa ----------------------------------------------------
-- Só admin escreve. Histórico sem edição destrutiva: não há update nem delete.

create table public.anotacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  texto text not null check (length(btrim(texto)) between 1 and 4000),
  visivel_para_empresa boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
alter table public.anotacoes enable row level security;
create index anotacoes_empresa on public.anotacoes (empresa_id, created_at desc);

create trigger definir_metadados before insert or update on public.anotacoes
for each row execute function public.definir_metadados();
create trigger registrar_auditoria after insert or update or delete on public.anotacoes
for each row execute function public.registrar_auditoria();

-- A empresa só vê o que foi marcado como visível; a admin vê tudo.
create policy anotacoes_select on public.anotacoes for select to authenticated
using (
  public.tem_acesso(empresa_id)
  and (select public.mfa_ok())
  and (visivel_para_empresa or public.tem_papel(empresa_id, '{admin}'))
);
create policy anotacoes_insert on public.anotacoes for insert to authenticated
with check (public.tem_papel(empresa_id, '{admin}') and (select public.mfa_ok()));
revoke update, delete, truncate on public.anotacoes from authenticated;

-- Gestão de vínculos ---------------------------------------------------------
-- Mesma checagem do convite (pode_convidar). A empresa nunca fica sem admin.

create function public.alterar_vinculo(p_vinculo_id uuid, p_papel public.papel) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_empresa_id uuid;
  v_papel public.papel;
begin
  select v.empresa_id, v.papel into v_empresa_id, v_papel from public.vinculos v where v.id = p_vinculo_id;
  if v_empresa_id is null or not public.pode_convidar(v_empresa_id) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  if v_papel = 'admin' and p_papel <> 'admin' and (
    select count(*) from public.vinculos v where v.empresa_id = v_empresa_id and v.papel = 'admin'
  ) = 1 then
    raise exception 'A empresa precisa de pelo menos uma administradora.' using errcode = 'P0001';
  end if;
  update public.vinculos set papel = p_papel where id = p_vinculo_id;
end $$;

create function public.remover_vinculo(p_vinculo_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_empresa_id uuid;
  v_papel public.papel;
begin
  select v.empresa_id, v.papel into v_empresa_id, v_papel from public.vinculos v where v.id = p_vinculo_id;
  if v_empresa_id is null or not public.pode_convidar(v_empresa_id) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  if v_papel = 'admin' and (
    select count(*) from public.vinculos v where v.empresa_id = v_empresa_id and v.papel = 'admin'
  ) = 1 then
    raise exception 'A empresa precisa de pelo menos uma administradora.' using errcode = 'P0001';
  end if;
  delete from public.vinculos where id = p_vinculo_id;
end $$;

revoke execute on function public.alterar_vinculo(uuid, public.papel) from public, anon;
revoke execute on function public.remover_vinculo(uuid) from public, anon;

-- Painel: uma consulta agregada por empresa -----------------------------------
-- security invoker: o RLS de cada tabela vale, então só aparecem empresas com vínculo.
-- Devolve somas; os cálculos e alertas ficam em src/features/painel/service.ts.
-- A taxa de cartão é arredondada por lançamento (dia e forma), como em
-- src/lib/money.ts (aplicarPercentual): round() do Postgres arredonda o meio para longe do zero.

create function public.painel_empresas(p_ano integer, p_mes integer)
returns table (
  empresa_id uuid,
  nome text,
  setor text,
  saldo_inicial_dinheiro bigint,
  saldo_inicial_banco bigint,
  entradas_dinheiro bigint,
  entradas_banco bigint,
  taxas_cartao bigint,
  movimento_dinheiro bigint,
  movimento_banco bigint,
  faturamento_mes bigint,
  saidas_mes bigint,
  taxas_cartao_mes bigint,
  pro_labore_mes bigint,
  dias_lancados_mes integer,
  dias_previstos integer,
  meta_faturamento bigint,
  ultimo_lancamento date,
  margem_lucro integer
)
language sql stable security invoker set search_path = '' as $$
  with periodo as (
    select make_date(p_ano, p_mes, 1) as inicio_mes,
           (make_date(p_ano, p_mes, 1) + interval '1 month' - interval '1 day')::date as fim_mes
  ),
  base as (
    select e.id, e.nome, e.setor, s.data_inicio,
           coalesce(s.saldo_dinheiro, 0) as saldo_dinheiro,
           coalesce(s.saldo_banco, 0) as saldo_banco
    from public.empresas e
    left join public.saldos_iniciais s on s.empresa_id = e.id
  ),
  entradas as (
    select en.empresa_id, en.data, en.valor, f.destino, f.conta_faturamento,
           (case f.destino
              when 'cartao_debito' then round(en.valor * coalesce(pm.taxa_debito, 0) / 10000.0)
              when 'cartao_credito' then round(en.valor * coalesce(pm.taxa_credito, 0) / 10000.0)
              else 0
            end)::bigint as taxa,
           en.data >= p.inicio_mes as no_mes
    from public.entradas_diarias en
    join public.formas_recebimento f on f.id = en.forma_id and f.empresa_id = en.empresa_id
    join base b on b.id = en.empresa_id
    cross join periodo p
    left join public.parametros_mes pm
      on pm.empresa_id = en.empresa_id
     and pm.ano = extract(year from en.data)::integer
     and pm.mes = extract(month from en.data)::integer
    where en.deleted_at is null
      and en.data <= p.fim_mes
      and (b.data_inicio is null or en.data >= b.data_inicio)
  ),
  movs as (
    select m.empresa_id, m.data, m.tipo, m.caixa, m.valor, c.eh_pro_labore,
           m.data >= p.inicio_mes as no_mes
    from public.movimentacoes m
    join base b on b.id = m.empresa_id
    cross join periodo p
    left join public.plano_contas c on c.id = m.conta_id and c.empresa_id = m.empresa_id
    where m.deleted_at is null
      and m.data <= p.fim_mes
      and (b.data_inicio is null or m.data >= b.data_inicio)
  ),
  soma_entradas as (
    select empresa_id,
           sum(valor) filter (where destino = 'dinheiro') as dinheiro,
           sum(valor) filter (where destino in ('banco', 'cartao_debito', 'cartao_credito')) as banco,
           sum(taxa) as taxas,
           sum(valor) filter (where no_mes and conta_faturamento) as faturamento_mes,
           sum(taxa) filter (where no_mes) as taxas_mes,
           count(distinct data) filter (where no_mes) as dias_lancados
    from entradas
    group by empresa_id
  ),
  soma_movs as (
    select empresa_id,
           sum(case
                 when caixa = 'dinheiro' then case when tipo = 'entrada' then valor else -valor end
                 when tipo = 'transferencia' then valor
                 else 0
               end) as dinheiro,
           sum(case
                 when caixa = 'banco' then case when tipo = 'entrada' then valor else -valor end
                 when tipo = 'transferencia' then valor
                 else 0
               end) as banco,
           sum(valor) filter (where no_mes and tipo = 'saida') as saidas_mes,
           sum(valor) filter (where no_mes and tipo = 'saida' and eh_pro_labore) as pro_labore_mes
    from movs
    group by empresa_id
  ),
  ultimo as (
    select empresa_id, max(data) as data from (
      select empresa_id, data from public.entradas_diarias where deleted_at is null
      union all
      select empresa_id, data from public.movimentacoes where deleted_at is null
    ) l
    group by empresa_id
  )
  select b.id, b.nome, b.setor,
         b.saldo_dinheiro, b.saldo_banco,
         coalesce(se.dinheiro, 0)::bigint, coalesce(se.banco, 0)::bigint, coalesce(se.taxas, 0)::bigint,
         coalesce(sm.dinheiro, 0)::bigint, coalesce(sm.banco, 0)::bigint,
         coalesce(se.faturamento_mes, 0)::bigint, coalesce(sm.saidas_mes, 0)::bigint,
         coalesce(se.taxas_mes, 0)::bigint, coalesce(sm.pro_labore_mes, 0)::bigint,
         coalesce(se.dias_lancados, 0)::integer,
         coalesce(pm.dias_previstos, 0), coalesce(pm.meta_faturamento, 0)::bigint,
         u.data,
         (select mk.margem_lucro from public.parametros_markup mk
           where mk.empresa_id = b.id and (mk.ano, mk.mes) <= (p_ano, p_mes)
           order by mk.ano desc, mk.mes desc limit 1)
  from base b
  left join soma_entradas se on se.empresa_id = b.id
  left join soma_movs sm on sm.empresa_id = b.id
  left join ultimo u on u.empresa_id = b.id
  left join public.parametros_mes pm on pm.empresa_id = b.id and pm.ano = p_ano and pm.mes = p_mes
  order by b.nome;
$$;

revoke execute on function public.painel_empresas(integer, integer) from public, anon;
