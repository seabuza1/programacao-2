# 0008 — Segundo fator desligado no piloto

**Data:** 2026-10-10 · **Status:** aceita (pedido do responsável pelo produto)

## Contexto
O projeto está em piloto/MVP de testes. O responsável pediu login só com e-mail e senha "pelo menos por enquanto", sem o código do app autenticador. A decisão 0002 e o item 1.3 do roadmap exigiam segundo fator para `admin_plataforma`, `admin` e `dono`.

## Decisão
- A exigência virou uma chave no banco: `public.configuracao_plataforma.exigir_segundo_fator` (uma linha só). A migration `20261010120000_segundo_fator_opcional.sql` cria a chave **desligada**.
- `precisa_mfa()` só devolve verdadeiro com a chave ligada. Tudo o mais continua igual: `mfa_ok()` nas policies, `exigirUsuario` no servidor, `pode_convidar`, `criar_empresa`. Com a chave desligada, `mfa_ok()` é verdadeiro para todos, e papel e vínculo continuam valendo.
- Sem a linha de configuração, o segundo fator volta a ser exigido (falha fechada).
- Nenhum cliente lê ou altera a chave (RLS sem policy e sem privilégio para `anon` e `authenticated`). Ela muda só pelo SQL Editor ou por migration.

## Como ligar de novo
No SQL Editor do Supabase:
```sql
update public.configuracao_plataforma set exigir_segundo_fator = true;
```
No login seguinte, quem é `admin_plataforma`, `admin` ou `dono` cadastra o app autenticador (se ainda não tiver) e passa a digitar o código. Para desligar, o mesmo comando com `false`.

## Consequências
- Risco maior de invasão de conta: com senha vazada ou fraca, quem a tiver entra direto, inclusive na conta da administradora, que vê todas as empresas dela. Continuam valendo: cadastro só por convite, senha mínima, limite de tentativas no login, captcha (com Turnstile configurado) e isolamento entre empresas no banco.
- **Recomendação:** ligar a chave antes de colocar dados reais de clientes.
- Testes: a suíte de banco liga a exigência durante a execução (`tests/apoio/global-setup.ts`), então o modo mais restrito continua coberto; `tests/regras/segundo-fator.test.ts` cobre o modo desligado, a volta e a falha fechada.
