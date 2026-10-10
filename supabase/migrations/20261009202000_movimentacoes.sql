-- Etapa 2.3: movimentações do livro (saídas, entradas e transferências).
-- saida exige conta do plano; entrada tem origem; transferencia sai de `caixa` e entra no outro.

create type public.caixa as enum ('dinheiro', 'banco');
create type public.tipo_movimentacao as enum ('saida', 'entrada', 'transferencia');
create type public.origem_entrada as enum ('recebimento_crediario', 'outro');

create table public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  data date not null check (data between '2000-01-01' and '2100-12-31'),
  descricao text not null default '' check (length(descricao) <= 200),
  tipo public.tipo_movimentacao not null,
  caixa public.caixa not null,
  valor bigint not null check (valor > 0),
  conta_id uuid,
  origem public.origem_entrada,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  -- A conta é sempre da mesma empresa.
  foreign key (conta_id, empresa_id) references public.plano_contas (id, empresa_id),
  check ((tipo = 'saida') = (conta_id is not null)),
  check ((tipo = 'entrada') = (origem is not null))
);
alter table public.movimentacoes enable row level security;
create index movimentacoes_empresa_data on public.movimentacoes (empresa_id, data);

create trigger definir_metadados before insert or update on public.movimentacoes
for each row execute function public.definir_metadados();
create trigger impedir_troca_de_empresa before update on public.movimentacoes
for each row execute function public.impedir_troca_de_empresa();
create trigger registrar_auditoria after insert or update or delete on public.movimentacoes
for each row execute function public.registrar_auditoria();

create policy movimentacoes_select on public.movimentacoes for select to authenticated
using (public.tem_acesso(empresa_id) and (select public.mfa_ok()));
create policy movimentacoes_insert on public.movimentacoes for insert to authenticated
with check (public.tem_papel(empresa_id, '{admin,dono,operador}') and (select public.mfa_ok()));
create policy movimentacoes_update on public.movimentacoes for update to authenticated
using (public.tem_papel(empresa_id, '{admin,dono,operador}') and (select public.mfa_ok()))
with check (public.tem_papel(empresa_id, '{admin,dono,operador}') and (select public.mfa_ok()));

revoke delete, truncate on public.movimentacoes from authenticated;
revoke update on public.movimentacoes from authenticated;
-- Corrigir um lançamento é excluir (logicamente) e lançar de novo.
grant update (deleted_at) on public.movimentacoes to authenticated;
