-- Etapa 2.1: formas de recebimento, plano de contas, parâmetros do mês e saldos iniciais.
-- Regras: docs/dominio.md, seção 3.

create type public.destino_recebimento as enum ('dinheiro', 'banco', 'cartao_debito', 'cartao_credito', 'nenhum');
create type public.grupo_conta as enum ('fixo', 'variavel', 'investimento');

-- Itens padrão não são apagados nem renomeados, só desativados.
create function public.proteger_item_padrao() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and old.padrao then
    raise exception 'Item padrão não pode ser apagado. Desative-o.' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and old.padrao and new.nome is distinct from old.nome then
    raise exception 'Item padrão não pode ser renomeado.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

-- Formas de recebimento ----------------------------------------------------

create table public.formas_recebimento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 60),
  destino public.destino_recebimento not null,
  conta_faturamento boolean not null default true,
  eh_crediario boolean not null default false,
  padrao boolean not null default false,
  ordem integer not null default 100 check (ordem between 0 and 10000),
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (empresa_id, nome),
  unique (id, empresa_id)
);
alter table public.formas_recebimento enable row level security;

-- Plano de contas ----------------------------------------------------------

create table public.plano_contas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  grupo public.grupo_conta not null,
  nome text not null check (length(btrim(nome)) between 1 and 80),
  padrao boolean not null default false,
  eh_pro_labore boolean not null default false,
  eh_despesa_financeira boolean not null default false,
  ordem integer not null default 100 check (ordem between 0 and 10000),
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (empresa_id, nome),
  unique (id, empresa_id)
);
alter table public.plano_contas enable row level security;

-- Parâmetros do mês --------------------------------------------------------

create table public.parametros_mes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ano integer not null check (ano between 2000 and 2100),
  mes integer not null check (mes between 1 and 12),
  dias_previstos integer not null default 0 check (dias_previstos between 0 and 31),
  meta_faturamento bigint not null default 0 check (meta_faturamento >= 0),
  taxa_debito integer not null default 0 check (taxa_debito between 0 and 10000),
  taxa_credito integer not null default 0 check (taxa_credito between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (empresa_id, ano, mes)
);
alter table public.parametros_mes enable row level security;

-- Saldos iniciais (um por empresa; valem no primeiro dia do mês de início) --

create table public.saldos_iniciais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresas (id) on delete cascade,
  data_inicio date not null check (extract(day from data_inicio) = 1),
  saldo_dinheiro bigint not null default 0,
  saldo_banco bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
alter table public.saldos_iniciais enable row level security;

-- Triggers e policies comuns ------------------------------------------------

do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array['formas_recebimento', 'plano_contas', 'parametros_mes', 'saldos_iniciais'] loop
    execute format('create trigger definir_metadados before insert or update on public.%I
      for each row execute function public.definir_metadados()', v_tabela);
    execute format('create trigger impedir_troca_de_empresa before update on public.%I
      for each row execute function public.impedir_troca_de_empresa()', v_tabela);
    execute format('create trigger registrar_auditoria after insert or update or delete on public.%I
      for each row execute function public.registrar_auditoria()', v_tabela);
    execute format('create policy %I on public.%I for select to authenticated
      using (public.tem_acesso(empresa_id) and (select public.mfa_ok()))', v_tabela || '_select', v_tabela);
    execute format('create policy %I on public.%I for insert to authenticated
      with check (public.tem_papel(empresa_id, ''{admin,dono}'') and (select public.mfa_ok()))', v_tabela || '_insert', v_tabela);
    execute format('create policy %I on public.%I for update to authenticated
      using (public.tem_papel(empresa_id, ''{admin,dono}'') and (select public.mfa_ok()))
      with check (public.tem_papel(empresa_id, ''{admin,dono}'') and (select public.mfa_ok()))', v_tabela || '_update', v_tabela);
    execute format('create policy %I on public.%I for delete to authenticated
      using (public.tem_papel(empresa_id, ''{admin,dono}'') and (select public.mfa_ok()))', v_tabela || '_delete', v_tabela);
  end loop;
end $$;

create trigger proteger_item_padrao before update or delete on public.formas_recebimento
for each row execute function public.proteger_item_padrao();
create trigger proteger_item_padrao before update or delete on public.plano_contas
for each row execute function public.proteger_item_padrao();

-- Privilégios por coluna: destino, grupo e marcações não mudam depois de criados,
-- e o cliente não cria item padrão.
revoke insert, update on public.formas_recebimento from authenticated;
grant insert (empresa_id, nome, destino, conta_faturamento, ordem, ativa) on public.formas_recebimento to authenticated;
grant update (nome, ordem, ativa) on public.formas_recebimento to authenticated;

revoke insert, update on public.plano_contas from authenticated;
grant insert (empresa_id, grupo, nome, ordem, ativa) on public.plano_contas to authenticated;
grant update (nome, ordem, ativa) on public.plano_contas to authenticated;

revoke update on public.parametros_mes from authenticated;
grant update (dias_previstos, meta_faturamento, taxa_debito, taxa_credito) on public.parametros_mes to authenticated;

revoke update on public.saldos_iniciais from authenticated;
grant update (data_inicio, saldo_dinheiro, saldo_banco) on public.saldos_iniciais to authenticated;

-- Seed padrão ---------------------------------------------------------------

create function public.semear_cadastros_padrao(p_empresa_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.formas_recebimento (empresa_id, nome, destino, conta_faturamento, eh_crediario, padrao, ordem)
  values
    (p_empresa_id, 'Dinheiro', 'dinheiro', true, false, true, 10),
    (p_empresa_id, 'Cartão Débito', 'cartao_debito', true, false, true, 20),
    (p_empresa_id, 'Cartão Crédito', 'cartao_credito', true, false, true, 30),
    (p_empresa_id, 'Pix', 'banco', true, false, true, 40),
    (p_empresa_id, 'Crediário Próprio (carnê)', 'nenhum', true, true, true, 50),
    (p_empresa_id, 'Boletos Bancários', 'banco', true, false, true, 60),
    (p_empresa_id, 'Brindes', 'nenhum', true, false, true, 70),
    (p_empresa_id, 'Permutas', 'nenhum', true, false, true, 80);

  insert into public.plano_contas (empresa_id, grupo, nome, padrao, eh_pro_labore, eh_despesa_financeira, ordem)
  select p_empresa_id, c.grupo::public.grupo_conta, c.nome, true, c.nome = 'Pró-labore dos sócios',
         c.nome = 'Despesas financeiras', c.ordem
  from (values
    ('fixo', 'Aluguel', 10),
    ('fixo', 'Água + luz', 20),
    ('fixo', 'Pró-labore dos sócios', 30),
    ('fixo', 'Salários + adiantamentos', 40),
    ('fixo', 'FGTS + INSS + encargos', 50),
    ('fixo', 'Alimentação', 60),
    ('fixo', 'Higiene e limpeza', 70),
    ('fixo', 'Telefone / internet', 80),
    ('fixo', 'IPTU', 90),
    ('fixo', 'Material de escritório e contabilidade', 100),
    ('fixo', 'Juros e multas por atrasos', 110),
    ('fixo', 'Convênios', 120),
    ('fixo', 'Vigilância sanitária / alvarás de licença', 130),
    ('fixo', 'Manutenção predial', 140),
    ('fixo', 'Outros', 150),
    ('variavel', 'Matéria-prima / mercadorias para venda', 10),
    ('variavel', 'Impostos + tributos', 20),
    ('variavel', 'Despesas financeiras', 30),
    ('variavel', 'Fretes / entregas', 40),
    ('variavel', 'Comissões sobre vendas / premiações', 50),
    ('variavel', 'Brindes', 60),
    ('variavel', 'Marketing / propagandas', 70),
    ('variavel', 'Embalagens + outras despesas', 80),
    ('variavel', 'Manutenção de ar-condicionado / outros equipamentos', 90),
    ('variavel', 'Combustível (empresa)', 100),
    ('variavel', 'Manutenção carro / moto da empresa', 110),
    ('variavel', 'Seguro da empresa / segurança do trabalho', 120),
    ('investimento', 'Aquisição de máquinas e equipamentos', 10),
    ('investimento', 'Pagamentos de empréstimos', 20),
    ('investimento', 'Reformas', 30),
    ('investimento', 'Cursos / consultorias / treinamentos / viagens', 40)
  ) as c (grupo, nome, ordem);
end $$;

revoke execute on function public.semear_cadastros_padrao(uuid) from public, anon, authenticated;

-- criar_empresa passa a semear os cadastros padrão na mesma transação.
create or replace function public.criar_empresa(p_nome text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_empresa_id uuid;
begin
  if not public.eh_admin_plataforma() or not public.mfa_ok() then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  insert into public.empresas (nome) values (btrim(p_nome)) returning id into v_empresa_id;
  insert into public.vinculos (empresa_id, usuario_id, papel)
  values (v_empresa_id, (select auth.uid()), 'admin');
  perform public.semear_cadastros_padrao(v_empresa_id);
  return v_empresa_id;
end $$;

-- Empresas já existentes (ambiente local) ganham o seed.
select public.semear_cadastros_padrao(e.id) from public.empresas e
where not exists (select 1 from public.formas_recebimento f where f.empresa_id = e.id);
