-- Etapa 2.2: caixa diário (entradas por dia e forma, e indicadores do dia).
-- Lançamentos usam exclusão lógica: ninguém apaga linha; deleted_at marca a exclusão.

create table public.entradas_diarias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  data date not null check (data between '2000-01-01' and '2100-12-31'),
  forma_id uuid not null,
  valor bigint not null check (valor > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  -- A forma é sempre da mesma empresa.
  foreign key (forma_id, empresa_id) references public.formas_recebimento (id, empresa_id)
);
alter table public.entradas_diarias enable row level security;
create unique index entradas_diarias_unica on public.entradas_diarias (empresa_id, data, forma_id)
  where deleted_at is null;
create index entradas_diarias_empresa_data on public.entradas_diarias (empresa_id, data);

create table public.indicadores_diarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  data date not null check (data between '2000-01-01' and '2100-12-31'),
  qtd_vendas integer not null default 0 check (qtd_vendas between 0 and 1000000),
  qtd_produtos integer not null default 0 check (qtd_produtos between 0 and 10000000),
  descontos bigint not null default 0 check (descontos >= 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
alter table public.indicadores_diarios enable row level security;
create unique index indicadores_diarios_unico on public.indicadores_diarios (empresa_id, data)
  where deleted_at is null;

do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array['entradas_diarias', 'indicadores_diarios'] loop
    execute format('create trigger definir_metadados before insert or update on public.%I
      for each row execute function public.definir_metadados()', v_tabela);
    execute format('create trigger impedir_troca_de_empresa before update on public.%I
      for each row execute function public.impedir_troca_de_empresa()', v_tabela);
    execute format('create trigger registrar_auditoria after insert or update or delete on public.%I
      for each row execute function public.registrar_auditoria()', v_tabela);
    execute format('create policy %I on public.%I for select to authenticated
      using (public.tem_acesso(empresa_id) and (select public.mfa_ok()))', v_tabela || '_select', v_tabela);
    execute format('create policy %I on public.%I for insert to authenticated
      with check (public.tem_papel(empresa_id, ''{admin,dono,operador}'') and (select public.mfa_ok()))', v_tabela || '_insert', v_tabela);
    execute format('create policy %I on public.%I for update to authenticated
      using (public.tem_papel(empresa_id, ''{admin,dono,operador}'') and (select public.mfa_ok()))
      with check (public.tem_papel(empresa_id, ''{admin,dono,operador}'') and (select public.mfa_ok()))', v_tabela || '_update', v_tabela);
    -- Sem policy de delete: exclusão é lógica.
    execute format('revoke delete, truncate on public.%I from authenticated', v_tabela);
  end loop;
end $$;

-- Só valor e exclusão lógica mudam; data e forma ficam como foram lançadas.
revoke update on public.entradas_diarias from authenticated;
grant update (valor, deleted_at) on public.entradas_diarias to authenticated;

revoke update on public.indicadores_diarios from authenticated;
grant update (qtd_vendas, qtd_produtos, descontos, deleted_at) on public.indicadores_diarios to authenticated;
