# Arquitetura

## Visão geral

```
Navegador ──► Next.js (Vercel)                     ──► Supabase (sa-east-1)
              Server Components e Server Actions        Postgres com RLS + Auth
              sessão em cookie HttpOnly                 chamado com a sessão do usuário
```

- O navegador nunca fala com o Supabase. Toda leitura e escrita passa pelo servidor do Next, que chama o Supabase com a sessão do usuário. O RLS vale em toda consulta.
- A chave secreta (equivalente à `service_role`) só é usada para enviar convite pelo Auth (`src/lib/supabase/admin.ts`). A permissão é conferida antes, com a sessão de quem convida.
- Sem variável `NEXT_PUBLIC_`: nada de configuração vai para o navegador.

## Camadas

Dependência em um sentido: `app → features → lib`. O ESLint barra import fora dessa direção e import de outra feature que não passe pelo `index.ts` dela.

| Pasta | O que tem |
| --- | --- |
| `src/app/` | Rotas, layouts e telas. Sem regra de negócio. `_componentes/` tem peças só de layout. |
| `src/features/<dominio>/` | Um diretório por domínio. |
| `src/lib/` | Dinheiro, percentual, datas, erros, clientes Supabase, ambiente e o kit de interface (`ui/`). |
| `supabase/migrations/` | Todo o schema, em SQL versionado. |
| `tests/` | Testes contra o Supabase local (isolamento e regras no banco). |

### Anatomia de uma feature

| Arquivo | Papel |
| --- | --- |
| `schema.ts` | Esquemas Zod de entrada. Listam os campos aceitos. |
| `service.ts` | Regras e cálculos. Funções puras: recebem dados, devolvem resultado, sem banco nem relógio. |
| `repository.ts` | Único lugar que acessa o banco. Recebe o cliente Supabase da requisição. |
| `actions.ts` | Server Actions. Orquestram o fluxo de uma mutação. |
| `components/` | Componentes da feature. Nunca acessam o banco. |
| `index.ts` | API pública da feature. |

`features/acesso/sessao.ts` concentra as checagens de servidor: `exigirUsuario`, `exigirEmpresa`, `exigirAdminPlataforma`.

## Fluxo de uma mutação

1. **Autenticar:** `exigirUsuario()` ou `exigirEmpresa()`. Sem sessão vai para `/entrar`; papel que exige segundo fator sem ele vai para `/entrar/segundo-fator`.
2. **Validar:** `esquema.safeParse()` com os campos do formulário, um a um.
3. **Checar permissão:** regra do `service.ts` (ex.: `podeLancar(papel)`). O banco confere de novo pelo RLS.
4. **Chamar o service** e gravar pelo `repository.ts`.
5. Devolver um `Resultado` (`src/lib/erros.ts`) só com a mensagem para a tela.

Cada página chama `exigir…()` de novo: no App Router o layout não roda a cada navegação, então a checagem só no layout não basta. As funções usam `cache()` do React e não repetem consultas na mesma requisição.

## Banco

- Toda tabela de negócio tem `id`, `empresa_id`, `created_at`, `updated_at`, `created_by`, preenchidos pelo trigger `definir_metadados`. `empresa_id` não muda depois de gravado.
- RLS habilitado na mesma migration que cria a tabela, com policy por operação.
- Acesso: `tem_acesso(empresa_id)` e `tem_papel(empresa_id, papeis)` consultam só `vinculos`. `mfa_ok()` exige sessão `aal2` de quem é `admin_plataforma`, `admin` ou `dono`.
- `auditoria` é alimentada por trigger e só aceita insert (nem a chave secreta altera).
- Funções `security definer` usam `search_path = ''` e nomes qualificados. Anônimo não tem permissão em nada.

## Sessão

- Cookies do Supabase com `HttpOnly`, `SameSite=Lax` e `Secure` em produção (`src/lib/supabase/cookies.ts`).
- `src/proxy.ts` renova a sessão a cada requisição e barra cedo quem não está logado.
- Empresa ativa: cookie `empresa_ativa`, conferido com `tem_acesso` a cada requisição. Com um único vínculo, ele vale sem escolher.

## Testes

- `pnpm test`: unitários (`src/**/*.test.ts`), sem banco.
- `pnpm test:db`: contra o Supabase local. Cada arquivo monta um cenário novo com empresas A e B e um usuário por papel (`tests/apoio/cenario.ts`), inclusive com segundo fator (TOTP gerado no teste).
