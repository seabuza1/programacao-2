# Auditoria de segurança (etapa 4.3)

**Data:** 2026-10-09 · **Escopo:** código da branch, migrations, configuração local do Supabase e CI. Produção ainda não existe: itens que dependem dela estão marcados e viram passo em `docs/producao.md`.

## Resultado

| # | Item | Status | Evidência |
| --- | --- | --- | --- |
| 1 | Segredos fora do código e do front-end | OK | Chave secreta só em `src/lib/supabase/admin.ts:3` (lida de `SUPABASE_SECRET_KEY`); `.env*` ignorado em `.gitignore:9`; `.env.example` sem valores. `git grep` por chaves (`sb_secret_`, JWT, chave privada) sem resultado. |
| 2 | Histórico do git sem segredos | OK | `git log -p --all` sem chave `sb_secret_`, JWT ou chave privada. A proteção de push do GitHub está ativa no repositório (barrou, antes de chegar ao remoto, um exemplo de chave num teste; o commit foi refeito sem ela). O seed e os testes só têm senhas fictícias de ambiente local (`supabase/seed.sql`, `tests/apoio/supabase.ts`). |
| 3 | Front-end só com a chave pública | OK (mais restrito) | O navegador não recebe nem a chave pública: nenhuma variável `NEXT_PUBLIC_` (`src/lib/ambiente.ts:18`) e nenhum componente cliente usa o Supabase. Busca no pacote `.next/static` por chave, URL ou porta do Supabase sem resultado. |
| 4 | RLS em todas as tabelas, com policy por operação | **FALHA → corrigida** | Guarda automática no CI: `tests/regras/catalogo.test.ts:42` exige RLS em toda tabela e policy para toda operação liberada. Ela achou funções executáveis por anônimo (ver F1); correção em `supabase/migrations/20261009221000_auditoria.sql`. |
| 5 | Dados criptografados em trânsito e em repouso | OK (fornecedores) | Supabase criptografa o disco (AES-256) e só aceita TLS; Vercel serve só HTTPS; HSTS em `src/lib/seguranca.ts:31`. Conferir a região sa-east-1 na criação do projeto (`docs/producao.md`). |
| 6 | Permissão conferida no servidor e no banco | OK | Servidor: `exigirUsuario`/`exigirEmpresa` (`src/features/acesso/sessao.ts:40`, `:68`) e regras de papel antes de cada ação. Banco: policies com `tem_acesso`, `tem_papel` e `mfa_ok()` (`supabase/migrations/20261009180000_fundacao.sql:156`). |
| 7 | Cada usuário acessa só o que é dele, testado trocando IDs | OK | `tests/isolamento/tabelas.test.ts:167`: usuário de B lê, altera, apaga e insere com ids de A em todas as tabelas de negócio (`:182`); `fundacao`, `painel` e `convite` cobrem as demais. |
| 8 | Mass assignment bloqueado | OK | Esquemas Zod listam cada campo (ex.: `src/features/fluxo-caixa/schema.ts:4`); privilégio por coluna no banco (ex.: `fundacao.sql:275`, `cadastros.sql:125`). `admin_plataforma`, `padrao`, `destino` e `empresa_id` não podem ser alterados pelo cliente (testado). |
| 9 | Cookies protegidos | OK | `HttpOnly`, `SameSite=Lax`, `Secure` em produção: `src/lib/supabase/cookies.ts:3`. Conferido no navegador com o build de produção. |
| 10 | Senha nunca guardada por nós | OK | Senhas só no Supabase Auth (bcrypt). O app não grava, não registra e não devolve senha; o formulário não reaproveita senha digitada (`src/lib/ui/Campo.tsx`). Mínimo de 10 caracteres com letras e números (`supabase/config.toml:183`). |
| 11 | Rate limit | OK | Limite no banco por e-mail/IP/usuário (hash): login, código do segundo fator, redefinição de senha, convite e exportação (`src/lib/limite.ts`, `src/features/autenticacao/actions.ts:53`). O Supabase Auth tem limites próprios para chamadas diretas à API (configurar em produção). |
| 12 | Proteção contra bot | OK (ligar em produção) | Cloudflare Turnstile verificado pelo Supabase Auth (`src/features/autenticacao/repository.ts:15`) e campo-armadilha (`actions.ts:36`). Fica desligado sem `TURNSTILE_SITE_KEY` (ambiente local). |
| 13 | Consultas parametrizadas | OK | Todo acesso pelo supabase-js/PostgREST (parâmetros), funções SQL com parâmetros tipados; SQL dinâmico só em `DO` de migration, com `format('%I')` sobre nomes fixos. Guarda: `catalogo.test.ts` ("nenhuma função monta SQL dinâmico"). |
| 14 | Entrada validada no servidor | OK | Toda Server Action valida com Zod antes de usar o dado; rota de exportação valida os parâmetros (`src/app/(empresa)/empresa/relatorios/exportar/route.ts`). Datas validadas pelo calendário real (`src/lib/datas.ts`). |
| 15 | Erros e logs sem vazamento | OK (melhorado) | Erros do banco viram mensagem genérica (`src/lib/erros.ts:82`); páginas de erro próprias sem detalhe técnico (`src/app/error.tsx`, `global-error.tsx`, `not-found.tsx`); nenhum `console.*` no código. Monitor de erros com limpeza de dados na etapa 4.5. |
| 16 | Uploads restritos | NÃO SE APLICA | O sistema não recebe arquivo. Storage desligado (`supabase/config.toml:116`). |
| 17 | Respostas só com os campos necessários | OK | Repositórios selecionam colunas explícitas (ex.: `src/features/cadastros/repository.ts:11`); a única leitura de todas as colunas é a exportação LGPD (`src/features/lgpd/repository.ts`), que por definição leva o registro completo e só para a admin da empresa; ações devolvem só `Resultado`; a grade recebe valores já formatados. |
| 18 | Cabeçalhos de segurança | OK | CSP com nonce por requisição (`src/lib/seguranca.ts:8`, `src/proxy.ts`), HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy e COOP (`next.config.ts:8`); sem `X-Powered-By` (`next.config.ts:5`). Navegação no build de produção sem nenhuma violação de CSP. |
| 19 | HTTPS forçado | OK | Redirecionamento 308 de http para https (`src/lib/seguranca.ts:44`) além do da Vercel; HSTS com preload; CSP `upgrade-insecure-requests`. |
| 20 | Dependências sem vulnerabilidade conhecida | OK (produção) | `pnpm audit --prod` sem vulnerabilidade, no CI (`.github/workflows/ci.yml:63`). Uma alta em dependência de desenvolvimento (ver F2). |

## Falhas encontradas, por gravidade

### F1 · Média · corrigida — funções executáveis por anônimo
Cinco funções das migrations da fase 2 ficaram com `EXECUTE` para `PUBLIC` (padrão do Postgres que a revogação "por schema" não remove). Gatilhos não são chamáveis pela API, mas `mes_fechado(empresa, ano, mes)` é `security definer` e respondia, para qualquer pessoa que soubesse o id da empresa, se o mês estava fechado.
**Correção:** revogação global para funções futuras e explícita para as atuais; `mes_fechado` só responde sobre empresa com vínculo (`20261009221000_auditoria.sql`). Testes: `catalogo.test.ts` e `livro-caixa.test.ts` ("consulta direta só responde sobre empresa com vínculo").

### F2 · Baixa · risco aceito — `braces` em ferramenta de lint
`braces <= 3.0.3` (negação de serviço por padrão aninhado) chega por `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch`. Sem versão corrigida publicada. Só roda no lint, sobre padrões do próprio repositório, e não vai para produção.
**Ação:** acompanhar a atualização do `eslint-config-next`; o CI barra vulnerabilidade alta nas dependências de produção.

### F3 · Baixa · corrigida — usuário logado com TRUNCATE em quatro tabelas
Achado na verificação da demonstração na nuvem (2026-10-10). A migration de cadastros não revogou `TRUNCATE` de `authenticated` em `formas_recebimento`, `plano_contas`, `parametros_mes` e `saldos_iniciais`. `TRUNCATE` ignora RLS e gatilhos de linha (trava de mês fechado, auditoria). A API do Supabase não executa `TRUNCATE`, então só uma sessão SQL direta com esse papel aproveitaria a brecha. `authenticated` também tinha `TRIGGER`, `REFERENCES` e `MAINTAIN`, que o app não usa.
**Correção:** `20261010130000_revogar_privilegios_sobrando.sql` revoga os quatro de todas as tabelas e dos privilégios padrão. Teste: `catalogo.test.ts` ("usuário logado não tem TRUNCATE, TRIGGER, REFERENCES nem MAINTAIN").

Nenhuma falha aberta.

## Como repetir
- `pnpm test:db` roda as guardas do catálogo (RLS, privilégios, `search_path`, SQL dinâmico) e os testes de isolamento.
- `pnpm audit --prod`.
- `git log -p --all | grep -E "sb_secret_|eyJhbGciOiJIUzI1NiIs|BEGIN PRIVATE KEY"` deve vir vazio.
- Depois do build: `grep -rE "sb_secret_|sb_publishable_|supabase\.co" .next/static` deve vir vazio.
