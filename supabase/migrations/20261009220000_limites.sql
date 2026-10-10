-- Fase 4.1: limite de tentativas (login, segundo fator, redefinição de senha, convite, exportação).
-- Guardado no banco para valer entre instâncias do servidor. A chave nunca leva dado pessoal:
-- e-mail e IP chegam como hash.

create table public.limites_de_taxa (
  chave text primary key check (length(chave) <= 200),
  janela_inicio timestamptz not null,
  contagem integer not null
);
alter table public.limites_de_taxa enable row level security;
-- Sem policy: nenhum cliente lê ou escreve. Só a função abaixo, chamada pelo servidor.
revoke all on public.limites_de_taxa from anon, authenticated;
create index limites_de_taxa_janela on public.limites_de_taxa (janela_inicio);

-- Janela fixa: devolve true se a tentativa ainda cabe no limite.
create function public.consumir_limite(p_chave text, p_maximo integer, p_janela_segundos integer)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_contagem integer;
  v_janela interval := make_interval(secs => p_janela_segundos);
begin
  insert into public.limites_de_taxa as l (chave, janela_inicio, contagem)
  values (p_chave, now(), 1)
  on conflict (chave) do update set
    janela_inicio = case when l.janela_inicio <= now() - v_janela then now() else l.janela_inicio end,
    contagem = case when l.janela_inicio <= now() - v_janela then 1 else l.contagem + 1 end
  returning contagem into v_contagem;
  -- Limpeza ocasional de janelas antigas.
  if random() < 0.01 then
    delete from public.limites_de_taxa where janela_inicio < now() - interval '1 day';
  end if;
  return v_contagem <= p_maximo;
end $$;

revoke execute on function public.consumir_limite(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consumir_limite(text, integer, integer) to service_role;
