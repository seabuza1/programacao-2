-- Etapas 2.7 e 2.8: precificação e análise de faturamento.
-- Percentuais em centésimos de % (1,2% = 120). Dinheiro em centavos.

create table public.parametros_markup (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ano integer not null check (ano between 2000 and 2100),
  mes integer not null check (mes between 1 and 12),
  taxa_cartao integer not null default 0 check (taxa_cartao between 0 and 10000),
  despesa_fixa integer not null default 0 check (despesa_fixa between 0 and 10000),
  imposto integer not null default 0 check (imposto between 0 and 10000),
  comissao integer not null default 0 check (comissao between 0 and 10000),
  investimentos integer not null default 0 check (investimentos between 0 and 10000),
  margem_lucro integer not null default 0 check (margem_lucro between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (empresa_id, ano, mes),
  check (taxa_cartao + despesa_fixa + imposto + comissao + investimentos + margem_lucro < 10000)
);

create table public.produtos_preco (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ano integer not null check (ano between 2000 and 2100),
  mes integer not null check (mes between 1 and 12),
  nome text not null check (length(btrim(nome)) between 1 and 120),
  custo bigint not null default 0 check (custo >= 0),
  frete bigint not null default 0 check (frete >= 0),
  embalagem bigint not null default 0 check (embalagem >= 0),
  imposto_entrada bigint not null default 0 check (imposto_entrada >= 0),
  preco_trabalhado bigint check (preco_trabalhado >= 0),
  preco_concorrente bigint check (preco_concorrente >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
create index produtos_preco_empresa_mes on public.produtos_preco (empresa_id, ano, mes);

create table public.faturamento_ano_anterior (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ano integer not null check (ano between 2000 and 2100),
  mes integer not null check (mes between 1 and 12),
  valor bigint not null default 0 check (valor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (empresa_id, ano, mes)
);

create table public.metas_anuais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ano integer not null check (ano between 2000 and 2100),
  crescimento_desejado integer not null default 0 check (crescimento_desejado between -10000 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (empresa_id, ano)
);

do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array['parametros_markup', 'produtos_preco', 'faturamento_ano_anterior', 'metas_anuais'] loop
    execute format('alter table public.%I enable row level security', v_tabela);
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
    execute format('revoke truncate on public.%I from authenticated', v_tabela);
  end loop;
end $$;

-- Colunas de identificação não mudam depois de criadas.
revoke update on public.parametros_markup from authenticated;
grant update (taxa_cartao, despesa_fixa, imposto, comissao, investimentos, margem_lucro)
  on public.parametros_markup to authenticated;
revoke update on public.produtos_preco from authenticated;
grant update (nome, custo, frete, embalagem, imposto_entrada, preco_trabalhado, preco_concorrente)
  on public.produtos_preco to authenticated;
revoke update on public.faturamento_ano_anterior from authenticated;
grant update (valor) on public.faturamento_ano_anterior to authenticated;
revoke update on public.metas_anuais from authenticated;
grant update (crescimento_desejado) on public.metas_anuais to authenticated;
