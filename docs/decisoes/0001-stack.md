# 0001 — Stack

**Data:** 2026-10-09 · **Status:** aceita

## Decisão
Next.js (App Router) + TypeScript strict + Supabase (Postgres, Auth, RLS) + Zod + Vitest, com pnpm, ESLint e Prettier, e deploy na Vercel. Como no `CLAUDE.md`.

## Versões
- TypeScript 6.0, não 7: o typescript-eslint (usado pelo lint do Next) ainda não aceita o 7.
- ESLint 9, não 10: os plugins do `eslint-config-next` ainda não aceitam o 10.
- Node 22 e pnpm 10 (fixado em `packageManager`).

## Dependências (uma linha cada)
- `next`, `react`, `react-dom`: framework da stack.
- `@supabase/supabase-js`: cliente do banco e do Auth.
- `@supabase/ssr`: sessão do Supabase em cookie, no servidor.
- `zod`: validação de entrada.
- `server-only`: quebra o build se código de servidor for importado no navegador.
- `supabase` (dev): CLI na mesma versão para todos e no CI.
- `typescript`, `eslint`, `eslint-config-next`, `prettier`, `vitest`, `@types/*` (dev): ferramentas da stack.

## Sem framework de CSS
Uma folha de estilo (`src/app/globals.css`) com variáveis e classes simples. Menos dependência, e as telas são formulários e tabelas.
