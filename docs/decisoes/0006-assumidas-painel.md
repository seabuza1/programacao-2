# 0006 — Painel da administradora (decisões e pontos a confirmar)

**Data:** 2026-10-09 · **Status:** aceita; itens A16 a A21 a confirmar com a administradora

## Decisão
- O painel lê uma única função no banco, `painel_empresas(ano, mes)`, com `security invoker`: o RLS de cada tabela vale, então só aparecem empresas com vínculo. A função devolve somas; saldo, lucro, previsão e alertas são calculados em `src/features/painel/service.ts`, com as mesmas funções do livro caixa.
- A taxa de cartão é a única conta feita no SQL (arredondada por lançamento, com `round()`, que segue a mesma regra de `aplicarPercentual`). O teste `tests/isolamento/painel.test.ts` confere que o resultado bate com os casos D, E e F do domínio.
- Limiares dos alertas em `src/features/painel/config.ts` (padrão: 3 dias sem lançar; pró-labore 20%).
- Exportação em Excel e PDF gerada no servidor (`/empresa/relatorios/exportar`), depois das mesmas checagens das telas. Dependências: `write-excel-file` (Excel, uma dependência só) e `pdf-lib` (PDF, sem binário nativo).

## Decisões assumidas (a confirmar)
| # | Decisão | Onde fica |
| --- | --- | --- |
| A16 | "Último lançamento" é a maior data (de negócio) entre entradas do caixa diário e movimentações. "Sem lançar há N dias" compara essa data com hoje. | `painel_empresas`, `alertasDaEmpresa` |
| A17 | O setor (serviços, comércio, indústria) é um campo da empresa. Sem setor, o alerta de margem não é avaliado. A margem usada é a do mês mais recente com parâmetros de markup até o mês do painel. | `empresas.setor`, `painel_empresas` |
| A18 | Os alertas do painel valem para o mês escolhido; só "sem lançar" usa a data de hoje. | `alertasDaEmpresa` |
| A19 | Anotação nasce interna ou visível para a empresa e não muda depois (sem edição destrutiva, inclusive da visibilidade). | migration `painel` |
| A20 | Exportação cobre o relatório gerencial/DRE do mês e o relatório anual. | rota `exportar` |
| A21 | Convidar alguém que já tem conta só cria o vínculo (sem novo e-mail). | `usuarios/repository.ts` (`enviarConvite`) |
