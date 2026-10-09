# 0003 — Arredondamento

**Data:** 2026-10-09 · **Status:** aceita

## Contexto
O domínio pede arredondamento "meio para cima, ao centavo", mas não diz o que fazer com valor negativo.

## Decisão
- Meio para cima afastando do zero: 2,5 → 3 e −2,5 → −3 (padrão comercial).
- A regra fica só em `src/lib/arredondamento.ts`. `money.ts` e `percent.ts` usam essa função.
- As contas são feitas com inteiros (`bigint`), sem float em nenhum passo.
- Percentual de relatório segue a mesma regra, ao centésimo de %, e só na leitura.

## Consequências
Mudar a regra é mudar um arquivo. Os testes de `src/lib/` usam os números da seção 7 de `docs/dominio.md`.
