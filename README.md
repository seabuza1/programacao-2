# Gestão Fácil SaaS

Livro caixa multiempresa com painel da administradora. Cada empresa lança o próprio caixa; a administradora acompanha todas num painel com indicadores, alertas e anotações.

- Regras do projeto: [`CLAUDE.md`](./CLAUDE.md)
- Regras de negócio: [`docs/dominio.md`](./docs/dominio.md) · decisões assumidas: [`docs/decisoes/`](./docs/decisoes)
- Etapas: [`docs/roadmap.md`](./docs/roadmap.md)
- Arquitetura: [`docs/arquitetura.md`](./docs/arquitetura.md) · segurança: [`docs/seguranca.md`](./docs/seguranca.md), [`docs/auditoria-seguranca.md`](./docs/auditoria-seguranca.md)
- Produção: [`docs/producao.md`](./docs/producao.md) · incidente: [`docs/incidente.md`](./docs/incidente.md)

## Rodar na sua máquina

Precisa de Node 22, pnpm 10 e Docker.

```bash
pnpm install
pnpm supabase start          # sobe o Supabase local (Postgres, Auth, e-mail de teste)
pnpm db:reset                # aplica as migrations e o seed com dados fictícios
pnpm supabase status         # mostra a URL e as chaves locais
cp .env.example .env.local   # preencha com os valores do status e SITE_URL=http://localhost:3000
pnpm dev                     # http://localhost:3000
```

Contas fictícias do seed (senha `Senha-ficticia-2026`):

| E-mail | Papel |
| --- | --- |
| `admin@gestaofacil.test` | administradora da plataforma (pede segundo fator no primeiro login) |
| `operadora@gestaofacil.test` | operadora da Loja Exemplo |

E-mails de convite e de redefinição de senha chegam no Mailpit local: http://127.0.0.1:54324.

## Verificar

```bash
pnpm lint && pnpm typecheck
pnpm test        # unitários e os casos da seção 7 do domínio
pnpm test:db     # isolamento entre empresas e regras no banco (com o Supabase local rodando)
pnpm build
```

O CI roda tudo isso em cada push e PR.
