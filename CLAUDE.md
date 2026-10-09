# Gestão Fácil SaaS

Livro caixa multiempresa com painel da administradora. Dados financeiros sensíveis: segurança e isolamento entre empresas vêm antes de velocidade.

## Stack
- Next.js (App Router) + TypeScript strict, pnpm
- Supabase: Postgres, Auth, RLS (região sa-east-1)
- Zod (validação), Vitest (testes), ESLint + Prettier
- Deploy: Vercel via GitHub

## Comandos
(atualize com os scripts reais)
- `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm format`
- `pnpm supabase start` · `pnpm db:reset` (aplica migrations e seed) · `pnpm db:types` (gera `src/lib/database.types.ts`)
- `pnpm test:db`: testes de isolamento contra o Supabase local

## Estrutura
- `src/app/`: rotas e telas. Sem regra de negócio.
- `src/features/<dominio>/`: um diretório por domínio, com `schema.ts` (Zod), `service.ts` (regras), `repository.ts` (banco), `components/` e `index.ts` (API pública).
- `src/lib/`: clientes Supabase, dinheiro, percentual, datas, erros.
- `supabase/migrations/`: todo o schema, em SQL versionado.
- `docs/`: `dominio.md` (regras de negócio), `roadmap.md` (etapas), `arquitetura.md`, `seguranca.md`, `decisoes/`.

## Regras de arquitetura
- Dependência em um sentido: app → features → lib.
- Uma feature só importa outra pelo `index.ts` dela.
- Banco só em `repository.ts`. Regra de negócio só em `service.ts`. Componente nunca acessa o banco.
- Cálculo de negócio é função pura em `service.ts`: recebe dados, devolve resultado, sem acessar banco nem relógio.
- Toda mutação segue: autenticar → validar com Zod → checar permissão → chamar service.
- Dinheiro é inteiro em centavos, com tipo próprio em `src/lib/money.ts`. Nunca float. Formatar só na exibição.
- Percentual é inteiro em centésimos de % (`1,2%` = `120`), com tipo próprio em `src/lib/percent.ts`.
- Arredondamento: meio para cima, ao centavo, quando o valor é gravado.
- Datas: `timestamptz` em UTC no banco; data do lançamento como `date`; exibir em America/Sao_Paulo.
- Nomes de domínio em português sem acento (`empresa`, `lancamento`); termos técnicos em inglês. Interface em pt-BR.
- Tipos de tabela são gerados do banco, nunca escritos à mão.
- Nova dependência só com justificativa em uma linha.

## Banco de dados
- Schema muda só por migration. Nunca pelo painel.
- Toda tabela de negócio tem `id uuid`, `empresa_id` (FK, not null), `created_at`, `updated_at`, `created_by`.
- RLS é habilitado na mesma migration que cria a tabela.
- Lançamentos usam exclusão lógica (`deleted_at`). `auditoria` só aceita insert, alimentada por trigger.
- Mês fechado não aceita insert, update nem delete nas tabelas de lançamento. A trava fica no banco.

## Acesso
- Acesso a dados é sempre por vínculo explícito. `tem_acesso(empresa_id)` consulta só `vinculos`, sem exceção para ninguém.
- Papéis do vínculo: `admin`, `dono`, `operador`, `leitor`. Único por (usuario_id, empresa_id).
- `admin` e `dono`: tudo na empresa. `operador`: lança e lê. `leitor`: só lê. Fechar e reabrir mês: `admin` e `dono`.
- `usuarios.admin_plataforma` libera só ações de plataforma (criar empresa, convidar usuário, ver o painel). Não dá acesso a dados. Nenhuma policy permite alterar esse campo pelo cliente.
- Ao criar uma empresa, o vínculo `admin` de quem criou nasce na mesma transação.
- Um usuário pode ter vínculo com várias empresas. A empresa ativa vem da sessão e é conferida com `tem_acesso` no servidor a cada requisição.
- Sem cadastro aberto. Só `admin_plataforma` convida. Essa checagem fica num único ponto.
- `empresas`, `usuarios`, `vinculos` e `auditoria` também têm RLS e teste de isolamento.

## Segurança
- Chave `service_role` só em código de servidor. Nunca em arquivo `'use client'` nem em variável `NEXT_PUBLIC_`.
- Segredos só em `.env.local`. Manter `.env.example` sem valores.
- Permissão é conferida no servidor e no banco, nunca só na tela.
- O schema Zod de cada mutação lista os campos aceitos. Nunca repasse o corpo da requisição direto para o banco.
- Respostas devolvem só os campos que a tela usa.
- Não registrar em log valores financeiros nem dados pessoais.
- Só dados fictícios em desenvolvimento e teste.
- Você não acessa produção e não roda migration em produção.

## Testes
- Toda tabela de negócio tem teste de isolamento: usuário da empresa A não lê nem altera linha da empresa B. Sem esse teste, a tarefa não está pronta.
- Todo `service.ts` e todo cálculo de dinheiro têm teste unitário.
- Os casos da seção 7 de `docs/dominio.md` são testes automáticos com os mesmos números.
- CI roda lint, typecheck e testes em todo PR.

## Fluxo de trabalho
- Uma etapa de `docs/roadmap.md` por vez. Antes: plano curto. Depois: lint, typecheck, testes, commit, resumo de 5 linhas, e espere meu OK.
- Uma branch por etapa. Commits pequenos, padrão Conventional Commits. Nunca commit direto na `main`.
- Ao concluir uma etapa, marque-a em `docs/roadmap.md`.
- Decisão de arquitetura vira um arquivo curto em `docs/decisoes/`.
- Regra de negócio vem de `docs/dominio.md`. Se não estiver lá, pergunte. Não invente.
- Fora do escopo, não implementar: integração bancária, nota fiscal, cobrança de assinatura, app nativo, IA sobre dados de clientes, produtos mais vendidos, importação de planilha.
