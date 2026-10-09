-- Fundação: usuários, empresas, vínculos, auditoria e controle de acesso.
-- Regras: CLAUDE.md, seções "Banco de dados" e "Acesso".

-- Ninguém anônimo acessa nada. Vale também para o que for criado depois.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;

create type public.papel as enum ('admin', 'dono', 'operador', 'leitor');

-- Metadados ---------------------------------------------------------------

create function public.definir_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- id, created_at e created_by são definidos pelo banco e nunca mudam.
create function public.definir_metadados() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := now();
    new.created_by := coalesce((select auth.uid()), new.created_by);
  else
    new.id := old.id;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
  end if;
  return new;
end $$;

-- Uma linha nunca muda de empresa.
create function public.impedir_troca_de_empresa() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id não pode mudar' using errcode = '42501';
  end if;
  return new;
end $$;

-- Usuários ----------------------------------------------------------------

create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nome text not null default '' check (length(nome) <= 120),
  admin_plataforma boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.usuarios enable row level security;

create trigger definir_updated_at before update on public.usuarios
for each row execute function public.definir_updated_at();

create function public.criar_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.usuarios (id, email) values (new.id, coalesce(new.email, ''));
  return new;
end $$;

create trigger criar_usuario after insert on auth.users
for each row execute function public.criar_usuario();

create function public.sincronizar_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.usuarios set email = coalesce(new.email, '') where id = new.id;
  return new;
end $$;

create trigger sincronizar_email after update of email on auth.users
for each row execute function public.sincronizar_email();

-- Empresas ----------------------------------------------------------------

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(btrim(nome)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
alter table public.empresas enable row level security;

create trigger definir_metadados before insert or update on public.empresas
for each row execute function public.definir_metadados();

-- Vínculos ----------------------------------------------------------------

create table public.vinculos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  papel public.papel not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (usuario_id, empresa_id)
);
alter table public.vinculos enable row level security;
create index vinculos_empresa_id_idx on public.vinculos (empresa_id);

create trigger definir_metadados before insert or update on public.vinculos
for each row execute function public.definir_metadados();
create trigger impedir_troca_de_empresa before update on public.vinculos
for each row execute function public.impedir_troca_de_empresa();

-- Funções de acesso -------------------------------------------------------
-- security definer: leem vinculos sem passar pelo RLS de vinculos (evita recursão).

-- Acesso a dados é sempre por vínculo explícito. Sem exceção para ninguém.
create function public.tem_acesso(p_empresa_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.vinculos v
    where v.empresa_id = p_empresa_id and v.usuario_id = (select auth.uid())
  );
$$;

create function public.tem_papel(p_empresa_id uuid, p_papeis public.papel[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.vinculos v
    where v.empresa_id = p_empresa_id
      and v.usuario_id = (select auth.uid())
      and v.papel = any (p_papeis)
  );
$$;

-- Libera só ações de plataforma. Não dá acesso a dados.
create function public.eh_admin_plataforma() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select u.admin_plataforma from public.usuarios u where u.id = (select auth.uid())),
    false
  );
$$;

-- Segundo fator obrigatório para admin_plataforma, admin e dono.
create function public.precisa_mfa() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.eh_admin_plataforma() or exists (
    select 1 from public.vinculos v
    where v.usuario_id = (select auth.uid()) and v.papel in ('admin', 'dono')
  );
$$;

create function public.mfa_ok() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2' or not public.precisa_mfa();
$$;

create function public.compartilha_empresa(p_usuario_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.vinculos meu
    join public.vinculos outro on outro.empresa_id = meu.empresa_id
    where meu.usuario_id = (select auth.uid()) and outro.usuario_id = p_usuario_id
  );
$$;

-- Auditoria ---------------------------------------------------------------

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tabela text not null,
  registro_id uuid not null,
  operacao text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  antes jsonb,
  depois jsonb,
  created_at timestamptz not null default now(),
  created_by uuid
);
alter table public.auditoria enable row level security;
create index auditoria_empresa_id_idx on public.auditoria (empresa_id, created_at desc);

create function public.registrar_auditoria() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_antes jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_depois jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_linha jsonb := coalesce(v_depois, v_antes);
begin
  insert into public.auditoria (empresa_id, tabela, registro_id, operacao, antes, depois, created_by)
  values (
    case when tg_table_name = 'empresas' then (v_linha ->> 'id')::uuid
         else (v_linha ->> 'empresa_id')::uuid end,
    tg_table_name,
    (v_linha ->> 'id')::uuid,
    tg_op,
    v_antes,
    v_depois,
    (select auth.uid())
  );
  return null;
end $$;

-- auditoria só aceita insert, e só pelo trigger.
create function public.impedir_alteracao_auditoria() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'auditoria só aceita insert' using errcode = '42501';
end $$;

create trigger impedir_alteracao before update or delete on public.auditoria
for each row execute function public.impedir_alteracao_auditoria();
create trigger impedir_truncate before truncate on public.auditoria
for each statement execute function public.impedir_alteracao_auditoria();

create trigger registrar_auditoria after insert or update or delete on public.empresas
for each row execute function public.registrar_auditoria();
create trigger registrar_auditoria after insert or update or delete on public.vinculos
for each row execute function public.registrar_auditoria();

-- Criação de empresa ------------------------------------------------------
-- O vínculo admin de quem criou nasce na mesma transação.

create function public.criar_empresa(p_nome text) returns uuid
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
  return v_empresa_id;
end $$;

-- Policies ----------------------------------------------------------------

create policy usuarios_select on public.usuarios for select to authenticated
using (
  id = (select auth.uid())
  or ((select public.mfa_ok()) and public.compartilha_empresa(id))
);
create policy usuarios_update on public.usuarios for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy empresas_select on public.empresas for select to authenticated
using (public.tem_acesso(id) and (select public.mfa_ok()));
create policy empresas_update on public.empresas for update to authenticated
using (public.tem_papel(id, '{admin,dono}') and (select public.mfa_ok()))
with check (public.tem_papel(id, '{admin,dono}') and (select public.mfa_ok()));

create policy vinculos_select on public.vinculos for select to authenticated
using (
  usuario_id = (select auth.uid())
  or (public.tem_papel(empresa_id, '{admin,dono}') and (select public.mfa_ok()))
);

create policy auditoria_select on public.auditoria for select to authenticated
using (public.tem_papel(empresa_id, '{admin,dono}') and (select public.mfa_ok()));

-- Privilégios -------------------------------------------------------------
-- Escrita direta só onde há policy. O resto passa por funções com checagem.

revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;

revoke insert, update, delete, truncate on public.usuarios from authenticated;
grant update (nome) on public.usuarios to authenticated;

revoke insert, update, delete, truncate on public.empresas from authenticated;
grant update (nome) on public.empresas to authenticated;

revoke insert, update, delete, truncate on public.vinculos from authenticated;
revoke insert, update, delete, truncate on public.auditoria from authenticated;
