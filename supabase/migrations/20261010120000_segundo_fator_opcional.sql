-- Segundo fator configurável (docs/decisoes/0008-segundo-fator-no-piloto.md).
-- No piloto fica desligado: todos entram com e-mail e senha.
-- Religar (SQL Editor do Supabase): update public.configuracao_plataforma set exigir_segundo_fator = true;

-- Configuração da plataforma: uma linha só. Não é tabela de negócio (sem empresa_id).
create table public.configuracao_plataforma (
  id boolean primary key default true check (id),
  exigir_segundo_fator boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.configuracao_plataforma enable row level security;
-- Sem policy: nenhum cliente lê ou altera. Muda só pelo SQL Editor ou por migration.
revoke all on public.configuracao_plataforma from anon, authenticated;

create trigger definir_updated_at before update on public.configuracao_plataforma
for each row execute function public.definir_updated_at();

insert into public.configuracao_plataforma (exigir_segundo_fator) values (false);

-- Sem a linha de configuração, o segundo fator volta a ser exigido.
create or replace function public.precisa_mfa() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select c.exigir_segundo_fator from public.configuracao_plataforma c), true)
     and (public.eh_admin_plataforma() or exists (
       select 1 from public.vinculos v
       where v.usuario_id = (select auth.uid()) and v.papel in ('admin', 'dono')
     ));
$$;
