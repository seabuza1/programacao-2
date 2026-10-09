# 0004 — Sessão só no servidor

**Data:** 2026-10-09 · **Status:** aceita

## Contexto
O Supabase permite que o navegador consulte o banco direto com a chave pública, confiando só no RLS.

## Decisão
- O navegador não fala com o Supabase. Telas leem dados em Server Components e escrevem por Server Actions.
- Os cookies de sessão são `HttpOnly`: o JavaScript da página não consegue lê-los.
- Toda consulta usa a sessão do usuário, então o RLS vale sempre. A permissão é conferida no servidor e de novo no banco.
- Links de e-mail (convite e redefinição) abrem uma tela com botão "Continuar"; o token só é usado no POST, para que leitores de link de e-mail não o gastem.

## Consequências
Uma única porta de entrada para os dados, mais fácil de auditar. O custo é uma ida ao servidor do Next a cada ação, aceitável para formulários e relatórios.
