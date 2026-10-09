-- Convite de usuários. Só admin_plataforma convida, e só para empresa onde tem vínculo admin.
-- Essa checagem fica num único ponto: pode_convidar.

create function public.pode_convidar(p_empresa_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.eh_admin_plataforma()
     and public.tem_papel(p_empresa_id, '{admin}')
     and public.mfa_ok();
$$;

-- Cria o vínculo de um usuário já existente (convidado agora ou antes).
create function public.vincular_por_email(p_email text, p_empresa_id uuid, p_papel public.papel)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid;
  v_vinculo_id uuid;
begin
  if not public.pode_convidar(p_empresa_id) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  select u.id into v_usuario_id from public.usuarios u where lower(u.email) = lower(btrim(p_email));
  if v_usuario_id is null then
    raise exception 'usuário não encontrado' using errcode = 'P0002';
  end if;
  insert into public.vinculos (empresa_id, usuario_id, papel)
  values (p_empresa_id, v_usuario_id, p_papel)
  returning id into v_vinculo_id;
  return v_vinculo_id;
end $$;

revoke execute on function public.pode_convidar(uuid) from public, anon;
revoke execute on function public.vincular_por_email(text, uuid, public.papel) from public, anon;
