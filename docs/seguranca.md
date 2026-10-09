# Segurança

Checklist para toda mudança. Se um item não se aplica, siga em frente; se se aplica e não está feito, a tarefa não está pronta.

## Nova tabela

- [ ] Criada por migration, nunca pelo painel.
- [ ] `id`, `empresa_id` (FK, not null), `created_at`, `updated_at`, `created_by` e os triggers `definir_metadados`, `impedir_troca_de_empresa` e `registrar_auditoria`.
- [ ] RLS habilitado na mesma migration, com uma policy por operação (select, insert, update, delete) e `mfa_ok()`.
- [ ] Privilégios revogados onde não há policy (ex.: `revoke delete` em lançamentos).
- [ ] Teste de isolamento: usuário de A não lê nem altera linha de B, e cada papel só faz o que pode.
- [ ] `pnpm db:types` rodado e tipos commitados.

## Nova mutação (Server Action)

- [ ] Autentica com `exigirUsuario()`/`exigirEmpresa()`/`exigirAdminPlataforma()`.
- [ ] Valida com Zod campo a campo. Nunca repassa o `FormData` ou o corpo inteiro para o banco.
- [ ] Confere a permissão no servidor (regra do `service.ts`) e confia no RLS como segunda barreira.
- [ ] Devolve só a mensagem para a tela. Nada de stack, SQL ou dado de outra empresa.

## Segredos e dados

- [ ] Chave secreta só em `src/lib/supabase/admin.ts`. Nunca em arquivo `'use client'` nem em `NEXT_PUBLIC_`.
- [ ] Segredos só em `.env.local` (local) e nas variáveis da Vercel (produção). `.env.example` sem valores.
- [ ] Respostas e props de componente com só os campos que a tela usa.
- [ ] Log sem valores financeiros e sem dado pessoal (e-mail, nome, CPF).
- [ ] Só dados fictícios em desenvolvimento e teste (`.test` como domínio de e-mail).

## Sessão e acesso

- [ ] Cookies `HttpOnly`, `SameSite=Lax`, `Secure` em produção.
- [ ] Segundo fator exigido no servidor e no banco para `admin_plataforma`, `admin` e `dono`.
- [ ] `admin_plataforma` não dá acesso a dados. Acesso só por vínculo.
- [ ] Cadastro aberto desligado (`enable_signup = false`). Só convite.
- [ ] Redirecionamento só para rotas internas conhecidas (`rotaDeRetornoSegura`).

## Antes de publicar

- [ ] CI verde: formatação, lint, typecheck, unitários, isolamento, build, `pnpm audit`.
- [ ] Migration nova revisada para RLS e privilégios.
- [ ] Nenhuma migration roda em produção a partir daqui: segue `docs/producao.md`.
