# Roadmap — Gestão Fácil SaaS

Uma etapa por vez. Marque `[x]` ao concluir. Cada fase só começa quando o critério de saída da anterior foi cumprido.

## Fase 1 — Fundação segura
- [x] 1.1 Repositório, Next.js, TypeScript strict, ESLint, Prettier, Vitest, scripts do package.json, `src/lib/money.ts` e `src/lib/percent.ts` com testes.
- [x] 1.2 Supabase local e migration inicial: `empresas` (só nome), `usuarios`, `vinculos`, `auditoria`, função `tem_acesso(empresa_id)`, RLS e testes de isolamento. Seed local com uma admin de e-mail e senha fictícios.
- [x] 1.3 Login por e-mail e senha, segundo fator (TOTP) obrigatório para `admin_plataforma`, `admin` e `dono`, convite de usuário, redefinição de senha.
- [x] 1.4 Layout base: área da empresa e área da administradora protegidas por papel, seletor de empresa ativa, telas vazias.
- [x] 1.5 CI no GitHub Actions: lint, typecheck e testes.
- [x] 1.6 `docs/arquitetura.md`, `docs/seguranca.md` (checklist), `docs/decisoes/0001-stack.md`, `docs/decisoes/0002-acesso-admin.md`.

**Saída:** os testes de isolamento passam no CI.

## Fase 2 — Livro caixa
- [x] 2.1 Cadastros: `formas_recebimento`, `plano_contas` (seed padrão ao criar empresa), `parametros_mes`, `saldos_iniciais`.
- [x] 2.2 Caixa diário: lançamento por dia e forma, indicadores do dia, totais, participação, médias e previsão. Testes A e D.
- [x] 2.3 Fluxo de caixa: movimentações, entradas e despesas automáticas, saldos encadeados mês a mês, crediário a receber. Testes B, E e I.
- [x] 2.4 Relatório gerencial e DRE. Testes C e F.
- [x] 2.5 Relatório anual e pró-labore. Teste G.
- [x] 2.6 Fechamento e reabertura de mês, com trava no banco.
- [x] 2.7 Precificação. Teste H.
- [x] 2.8 Análise de faturamento.

Telas da empresa: Resumo do mês (faturamento, previsão contra a meta, saldos, lucro), Caixa diário (grade de dias por formas, editável, como na planilha), Fluxo de caixa (livro com saldo corrente), Relatórios, Precificação, Configurações. Tudo utilizável no celular.

**Saída:** todos os casos da seção 7 do domínio passam e eu consigo lançar um mês inteiro sem ajuda.

## Fase 3 — Painel da administradora
- [x] 3.1 Lista de empresas: saldo de dinheiro e banco, faturamento do mês, lucro do mês, previsão contra a meta, data do último lançamento. Uma consulta agregada, respeitando os vínculos.
- [x] 3.2 Alertas da seção 6 do domínio, como funções puras testadas. Limiares em configuração (padrão: 3 dias sem lançar).
- [x] 3.3 Anotações por empresa: texto, autor, data, `visivel_para_empresa`. Só `admin` escreve. Histórico sem edição destrutiva.
- [x] 3.4 Cadastro de empresa e gestão de usuários e vínculos.
- [x] 3.5 Exportação dos relatórios em Excel e PDF, gerada no servidor, com a permissão conferida.

**Saída:** a administradora usa o painel numa reunião real com dados fictícios.

## Fase 4 — Endurecimento
- [x] 4.1 Rate limit em login, convite, redefinição de senha e exportação. Proteção contra bot no login.
- [x] 4.2 Cabeçalhos de segurança (CSP, HSTS, X-Frame-Options, X-Content-Type-Options), HTTPS forçado, cookies com HttpOnly, Secure e SameSite.
- [x] 4.3 Auditoria de segurança de 20 itens (abaixo). Para cada um: OK, FALHA ou NÃO SE APLICA, com arquivo e linha. Liste as falhas por gravidade, proponha a correção e espere meu OK.
- [x] 4.4 LGPD: exportação completa dos dados de uma empresa e exclusão com confirmação. Páginas de termos de uso e política de privacidade com texto marcado "RASCUNHO, revisar com advogado".
- [ ] 4.5 Monitor de erros sem dados financeiros nem pessoais nos eventos.
- [ ] 4.6 `docs/producao.md`: passo a passo para eu criar o projeto de produção, aplicar migrations, criar a primeira admin, ligar backups e recuperação ponto a ponto, e testar uma restauração. `docs/incidente.md`: plano de uma página.

Auditoria 4.3: (1) segredos fora do código e do front-end; (2) histórico do git sem segredos; (3) front-end só com a chave pública; (4) RLS em todas as tabelas, com policy por operação; (5) dados criptografados em trânsito e em repouso; (6) permissão conferida no servidor e no banco; (7) cada usuário acessa só o que é dele, testado trocando IDs; (8) mass assignment bloqueado; (9) cookies protegidos; (10) senha nunca guardada por nós; (11) rate limit; (12) proteção contra bot; (13) consultas parametrizadas; (14) entrada validada no servidor; (15) erros e logs sem vazamento; (16) uploads restritos; (17) respostas só com os campos necessários; (18) cabeçalhos de segurança; (19) HTTPS forçado; (20) dependências sem vulnerabilidade conhecida.

**Saída:** auditoria sem FALHA aberta e restauração de backup testada por mim.

## Fase 5 — Piloto
Sem código novo além de correções. Duas ou três empresas reais em paralelo com a planilha, por um fechamento de mês completo.

**Saída:** fechamento igual ao esperado e nenhum incidente.
