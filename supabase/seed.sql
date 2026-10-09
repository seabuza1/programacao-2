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

-- Operadora fictícia (não precisa de segundo fator): operadora@gestaofacil.test / Senha-ficticia-2026
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000002',
  'authenticated', 'authenticated', 'operadora@gestaofacil.test',
  extensions.crypt('Senha-ficticia-2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000002',
  'email',
  '{"sub":"a0000000-0000-4000-8000-000000000002","email":"operadora@gestaofacil.test","email_verified":true}',
  now(), now(), now()
);

update public.usuarios set nome = 'Operadora Fictícia'
where id = 'a0000000-0000-4000-8000-000000000002';

-- Empresa de demonstração com os casos A, C e D de docs/dominio.md (janeiro e fevereiro de 2026).
insert into public.empresas (id, nome)
values ('e0000000-0000-4000-8000-000000000001', 'Loja Exemplo (fictícia)');
select public.semear_cadastros_padrao('e0000000-0000-4000-8000-000000000001');

insert into public.vinculos (empresa_id, usuario_id, papel) values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'admin'),
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'operador');

insert into public.saldos_iniciais (empresa_id, data_inicio, saldo_dinheiro, saldo_banco)
values ('e0000000-0000-4000-8000-000000000001', '2026-01-01', 30000, 350000);

insert into public.parametros_mes (empresa_id, ano, mes, dias_previstos, meta_faturamento, taxa_debito, taxa_credito)
values
  ('e0000000-0000-4000-8000-000000000001', 2026, 1, 26, 17000000, 0, 0),
  ('e0000000-0000-4000-8000-000000000001', 2026, 2, 25, 10000000, 120, 1050);

-- Caso A: Dinheiro 8.750,00 de 28 a 31 de janeiro.
insert into public.entradas_diarias (empresa_id, data, forma_id, valor)
select f.empresa_id, d::date, f.id, 875000
from generate_series('2026-01-28'::date, '2026-01-31'::date, interval '1 day') d
join public.formas_recebimento f
  on f.empresa_id = 'e0000000-0000-4000-8000-000000000001' and f.nome = 'Dinheiro';

-- Caso D: 28 de fevereiro.
insert into public.entradas_diarias (empresa_id, data, forma_id, valor)
select f.empresa_id, '2026-02-28', f.id, v.valor
from (values
  ('Dinheiro', 71100),
  ('Cartão Débito', 158827),
  ('Cartão Crédito', 74078),
  ('Pix', 62236),
  ('Crediário Próprio (carnê)', 5500)
) v (nome, valor)
join public.formas_recebimento f
  on f.empresa_id = 'e0000000-0000-4000-8000-000000000001' and f.nome = v.nome;

-- Caso C: saídas de janeiro, pagas pelo banco.
insert into public.movimentacoes (empresa_id, data, tipo, caixa, valor, conta_id)
select c.empresa_id, '2026-01-31', 'saida', 'banco', v.valor, c.id
from (values
  ('Pró-labore dos sócios', 500000),
  ('FGTS + INSS + encargos', 1000000),
  ('Matéria-prima / mercadorias para venda', 2000000),
  ('Impostos + tributos', 300000),
  ('Despesas financeiras', 30000),
  ('Marketing / propagandas', 50000),
  ('Aquisição de máquinas e equipamentos', 100000)
) v (nome, valor)
join public.plano_contas c
  on c.empresa_id = 'e0000000-0000-4000-8000-000000000001' and c.nome = v.nome;

-- Caso H: precificação de fevereiro (despesa fixa 24% + margem 9,5%).
insert into public.parametros_markup (empresa_id, ano, mes, despesa_fixa, margem_lucro)
values ('e0000000-0000-4000-8000-000000000001', 2026, 2, 2400, 950);
insert into public.produtos_preco (empresa_id, ano, mes, nome, custo)
values
  ('e0000000-0000-4000-8000-000000000001', 2026, 2, 'Produto A (fictício)', 500),
  ('e0000000-0000-4000-8000-000000000001', 2026, 2, 'Produto B (fictício)', 2050);
