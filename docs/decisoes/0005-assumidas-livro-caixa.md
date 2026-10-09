# 0005 — Decisões assumidas no livro caixa (a confirmar)

**Data:** 2026-10-09 · **Status:** assumidas, a confirmar com a administradora

O `docs/dominio.md` não cobria os pontos abaixo. Cada um ficou num ponto só do código para mudar depois sem efeito em cascata.

| # | Decisão | Onde fica |
| --- | --- | --- |
| A3 | Previsão = faturamento × dias previstos ÷ dias lançados, arredondada uma vez (mesmo valor que média realizada × dias previstos, sem somar erro de arredondamento). Sem dias previstos: "—". | `caixa-diario/service.ts` |
| A4 | Na transferência, `caixa` é de onde o dinheiro sai; entra no outro caixa. | `fluxo-caixa/service.ts` (`efeitoDaMovimentacao`) |
| A5 | Saldos iniciais valem no primeiro dia do mês de início. Lançamentos anteriores ao início não entram no saldo. Sem saldo inicial cadastrado, o saldo começa em zero. | `fluxo-caixa/service.ts` (`saldoInicialDoMes`) |
| A6 | Mês fechado trava também os parâmetros do mês (a taxa de cartão muda a despesa). Saldos iniciais ficam travados enquanto houver qualquer mês fechado. Só se fecha mês que já terminou. | migration `fechamento`, `fechamento/service.ts` |
| A7 | Destino, "conta no faturamento" e grupo não mudam depois de criados, para não reescrever meses passados. Item próprio pode ser renomeado e desativado; item padrão só desativado. | privilégios por coluna na migration `cadastros` |
| A8 | Lançam: admin, dono e operador (caixa diário, indicadores, livro). Só admin e dono: cadastros, parâmetros, saldos iniciais, precificação, análise, fechamento. | policies das migrations, `acesso/service.ts` |
| A9 | O crediário é a forma marcada `eh_crediario` (a padrão "Crediário Próprio (carnê)"). Crediário a receber é acumulado até o fim do mês consultado. | `formas_recebimento.eh_crediario`, `crediarioAReceber` |
| A10 | Corrigir uma movimentação = excluir (logicamente) e lançar de novo. Só `deleted_at` pode ser alterado. | migration `movimentacoes` |
| A11 | Ticket médio = faturamento ÷ soma das vendas (quantidade) do mês. Sem vendas: "—". | `caixa-diario/service.ts` |
| A12 | No caixa diário, apagar o valor da célula (ou digitar zero) exclui logicamente o lançamento. | `caixa-diario/repository.ts` |
| A13 | `faturamento_ano_anterior.ano` é o ano a que o valor se refere (2025 para a análise de 2026). | `relatorios/repository.ts` |
| A14 | Forma ou conta desativada só aparece em grade e relatório se tiver valor no período. | telas e `relatorios/service.ts` |
| A15 | Pró-labore: o aviso considera só o limite de 20%. O mínimo de 1 salário mínimo aparece como orientação, sem cálculo (o valor do salário mínimo não está no domínio). | `relatorios/service.ts` |
