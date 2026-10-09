-- Seed local. Só dados fictícios.
-- Admin da plataforma: admin@gestaofacil.test / Senha-ficticia-2026

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'admin@gestaofacil.test',
  extensions.crypt('Senha-ficticia-2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'email',
  '{"sub":"a0000000-0000-4000-8000-000000000001","email":"admin@gestaofacil.test","email_verified":true}',
  now(), now(), now()
);

update public.usuarios
set admin_plataforma = true, nome = 'Administradora Fictícia'
where id = 'a0000000-0000-4000-8000-000000000001';
