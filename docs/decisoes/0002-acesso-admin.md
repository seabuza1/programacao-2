# 0002 — Acesso e administradora

**Data:** 2026-10-09 · **Status:** aceita

## Decisão
- Acesso a dados só por vínculo explícito (`vinculos`). `tem_acesso` e `tem_papel` consultam só essa tabela.
- `usuarios.admin_plataforma` libera ações de plataforma (criar empresa, convidar, ver o painel) e nada mais. Ao criar uma empresa (`criar_empresa`), a administradora ganha vínculo `admin` na mesma transação; é esse vínculo que dá acesso aos dados.
- Nenhum cliente altera `admin_plataforma`: só existe privilégio de update na coluna `nome`. Promover alguém é feito no banco de produção por quem opera (ver `docs/producao.md`).
- Segundo fator: quem é `admin_plataforma` ou tem vínculo `admin`/`dono` só lê e escreve com sessão `aal2`. A regra fica no banco (`mfa_ok()` em toda policy) e no servidor (`exigirUsuario`).
- Convite: único ponto de checagem é `pode_convidar(empresa)` = admin da plataforma + vínculo `admin` na empresa + segundo fator. Vínculos só são criados por funções que chamam essa checagem; não há insert/update/delete direto em `vinculos`.

## Decisões assumidas (a confirmar)
- **A1.** Gestão de vínculos (convidar, adicionar, trocar papel, remover) é da administradora da plataforma com vínculo `admin` na empresa. O dono vê a lista de usuários da empresa, mas não gerencia, para não remover a consultoria por engano.
- **A2.** No primeiro login, quem precisa de segundo fator cadastra o autenticador logo após a senha. Perda do celular: a administradora remove o fator pelo painel do Supabase (passo em `docs/producao.md`).

## Consequências
Uma empresa nova só fica visível para a administradora que a criou e para quem ela convidar. Outra pessoa da consultoria precisa de vínculo próprio.
