# Domínio — Gestão Fácil

Fonte: planilha "Projeto 2026" da Gestão Fácil (valores, sem as fórmulas). As regras foram deduzidas dos valores e conferidas com janeiro e fevereiro. A seção 8 lista as decisões que foram assumidas sem confirmação da administradora; cada uma está isolada num ponto só do código para poder mudar depois.

## 1. Visão geral

Cada empresa, a cada mês, tem quatro blocos:

1. **Caixa diário**: quanto entrou por dia, por forma de recebimento.
2. **Fluxo de caixa (livro)**: saídas e movimentações, com saldo de Dinheiro e de Banco.
3. **Relatórios**: gerencial mensal, DRE simplificado, anual, pró-labore, análise de faturamento.
4. **Precificação**: markup e preço sugerido por produto.

O ano tem 12 meses independentes, ligados só pelo saldo que passa de um mês para o seguinte.

## 2. Convenções

- Dinheiro em centavos inteiros. Percentuais guardados em centésimos de % (`1,2%` = `120`).
- Arredondamento: meio para cima, ao centavo, no momento em que o valor é gravado (taxa de cartão, preço sugerido).
- Percentuais de relatório são calculados na leitura e nunca gravados. Divisão por zero exibe "—", nunca erro.
- Existem exatamente dois caixas: `dinheiro` e `banco`.
- Datas são validadas pelo calendário real (a planilha tem 31 colunas em todo mês).

## 3. Entidades

Todas levam `empresa_id` e seguem as regras de banco do CLAUDE.md.

| Entidade | Campos de negócio |
| --- | --- |
| `formas_recebimento` | nome, destino (`dinheiro`, `banco`, `cartao_debito`, `cartao_credito`, `nenhum`), conta_faturamento, padrao, ordem, ativa |
| `entradas_diarias` | data, forma_id, valor. Única por (empresa, data, forma) |
| `indicadores_diarios` | data, qtd_vendas, qtd_produtos, descontos. Única por (empresa, data) |
| `parametros_mes` | ano, mes, dias_previstos, meta_faturamento, taxa_debito, taxa_credito |
| `saldos_iniciais` | data de início, saldo_dinheiro, saldo_banco. Um por empresa |
| `plano_contas` | grupo (`fixo`, `variavel`, `investimento`), nome, padrao, eh_pro_labore, eh_despesa_financeira, ordem, ativa |
| `movimentacoes` | data, descricao, tipo (`saida`, `entrada`, `transferencia`), caixa, valor, conta_id, origem |
| `parametros_markup` | ano, mes, taxa_cartao, despesa_fixa, imposto, comissao, investimentos, margem_lucro |
| `produtos_preco` | ano, mes, nome, custo, frete, embalagem, imposto_entrada, preco_trabalhado, preco_concorrente |
| `faturamento_ano_anterior` | ano, mes, valor |
| `metas_anuais` | ano, crescimento_desejado |
| `produtos_destaque`, `vendas_produto_dia` | Produtos mais vendidos por dia, em reais ou quantidade. Fora da fase 2 |

Regras de `movimentacoes`:
- `saida` exige `conta_id` (plano de contas). `entrada` e `transferencia` não usam plano de contas.
- `entrada` tem `origem`: `recebimento_crediario` ou `outro`. Entrada do livro nunca conta como faturamento.
- `transferencia` move valor de um caixa para o outro (ex.: depósito do dinheiro no banco).
- Valor sempre positivo; o tipo define o sinal.

### Formas de recebimento padrão (seed por empresa)

| Forma | Destino | Conta no faturamento |
| --- | --- | --- |
| Dinheiro | dinheiro | sim |
| Cartão Débito | cartao_debito | sim |
| Cartão Crédito | cartao_credito | sim |
| Pix | banco | sim |
| Crediário Próprio (carnê) | nenhum | sim |
| Boletos Bancários | banco | sim |
| Brindes | nenhum | sim |
| Permutas | nenhum | sim |

### Plano de contas padrão (seed por empresa)

- **Custos fixos**: Aluguel · Água + luz · Pró-labore dos sócios · Salários + adiantamentos · FGTS + INSS + encargos · Alimentação · Higiene e limpeza · Telefone / internet · IPTU · Material de escritório e contabilidade · Juros e multas por atrasos · Convênios · Vigilância sanitária / alvarás de licença · Manutenção predial · Outros
- **Custos variáveis**: Matéria-prima / mercadorias para venda · Impostos + tributos · Despesas financeiras · Fretes / entregas · Comissões sobre vendas / premiações · Brindes · Marketing / propagandas · Embalagens + outras despesas · Manutenção de ar-condicionado / outros equipamentos · Combustível (empresa) · Manutenção carro / moto da empresa · Seguro da empresa / segurança do trabalho
- **Investimentos**: Aquisição de máquinas e equipamentos · Pagamentos de empréstimos · Reformas · Cursos / consultorias / treinamentos / viagens

"Pró-labore dos sócios" leva `eh_pro_labore`. "Despesas financeiras" leva `eh_despesa_financeira`.

Itens padrão (formas e contas) não podem ser apagados nem renomeados, só desativados. A empresa pode criar itens próprios dentro dos três grupos.

## 4. Regras de cálculo

### Caixa diário
- `total_dia` = soma das formas no dia.
- `faturamento_mes` = soma, no mês, das formas com `conta_faturamento`.
- `participacao_forma` = total da forma ÷ faturamento_mes.
- `dias_lancados` = quantidade de dias do mês com alguma entrada maior que zero.
- `media_necessaria` = meta_faturamento ÷ dias_previstos.
- `media_realizada` = faturamento_mes ÷ dias_lancados.
- `previsao_fechamento` = media_realizada × dias_previstos.
- `ticket_medio` = faturamento_mes ÷ qtd_vendas do mês.

### Fluxo de caixa
- Saldo inicial do mês = saldo final do mês anterior. No primeiro mês, vem de `saldos_iniciais`.
- Entradas automáticas, geradas a partir do caixa diário, no dia do lançamento:
  - destino `dinheiro` → soma no caixa dinheiro;
  - destino `banco` → soma no banco;
  - `cartao_debito` → soma no banco; gera despesa = valor × taxa_debito;
  - `cartao_credito` → soma no banco (com antecipação, no mesmo mês); gera despesa = valor × taxa_credito;
  - `nenhum` → não altera saldo.
- A despesa de cartão é calculada por dia e por forma, e arredondada ao centavo.
- Saldo final = saldo inicial + entradas automáticas − despesas de cartão + movimentações do livro.
- Entradas e despesas automáticas não são editáveis no livro. Mudam só quando o caixa diário ou a taxa mudam.
- Crediário: a venda conta no faturamento do dia e não altera saldo. Quando o cliente paga o carnê, lança-se uma `entrada` no livro com origem `recebimento_crediario`.
- `crediario_a_receber` = total vendido no crediário − total de entradas com origem `recebimento_crediario`.

### Relatório gerencial e DRE
- Total por conta = soma das saídas da conta no mês. Total por grupo = soma das contas do grupo.
- A conta com `eh_despesa_financeira` soma também as despesas automáticas de cartão do mês.
- `% da conta` = total da conta ÷ faturamento_mes.
- DRE: `lucro` = faturamento_mes − fixos − variáveis − investimentos. `% lucro` = lucro ÷ faturamento_mes.
- A coluna "Rateio" da planilha não é implementada.

### Relatório anual
- Mesmas linhas do caixa diário e do plano de contas, uma coluna por mês, mais Total e Média.
- `% da linha` = total anual da linha ÷ faturamento do ano (vale para entradas e saídas).
- `lucro_ano` = faturamento do ano − saídas do ano.
- `meses_lancados` = quantidade de meses do ano com faturamento maior que zero.
- `media` = total ÷ meses_lancados.

### Pró-labore
- `retiradas_mes` = saídas na conta marcada `eh_pro_labore`. `%` = retiradas_mes ÷ faturamento_mes.
- Orientação da planilha: no mínimo 1 salário mínimo, sem passar de 20% do faturamento.

### Precificação
- `markup` = 1 − (taxa_cartao + despesa_fixa + imposto + comissao + investimentos + margem_lucro).
- `custo_total` = custo + frete + embalagem + imposto_entrada.
- `preco_sugerido` = custo_total ÷ markup.
- Validação: cada percentual entre 0 e 100%; a soma tem de ser menor que 100%. Caso contrário, erro e nenhum preço.
- Faixas de margem sugeridas pela planilha: serviços 20–30%, comércio 15–20%, indústria 8–12%.

### Análise de faturamento
- Compara o ano anterior com o realizado, mês a mês, mais total e média (total ÷ 12, como na planilha).
- `meta_mes` = faturamento do mesmo mês no ano anterior × (1 + crescimento_desejado).
- `crescimento_mes` = realizado ÷ ano anterior − 1.

## 5. Onde o sistema difere da planilha

| Planilha | Sistema |
| --- | --- |
| De março a dezembro, "Entradas do mês" do fluxo aponta para o caixa diário de janeiro; o saldo sobe R$ 35.000 por mês sem venda nenhuma | Cada mês usa só o próprio caixa diário |
| Pix e boleto não entram em saldo nenhum | Entram no banco |
| Despesa de cartão reduz o saldo do banco mas não aparece no DRE | Entra em "Despesas financeiras" |
| Despesa de cartão com frações de centavo (19,05924) | Arredonda ao centavo (19,06) |
| "Dias lançados" e "Meses lançados" digitados à mão | Calculados |
| Markup aceita valor em reais no lugar de percentual e devolve preço negativo | Valida a soma dos percentuais |
| Divisão por zero mostra #DIV/0! | Mostra "—" |

Por causa das linhas 2, 3 e 5, o sistema não bate com a planilha em fevereiro e no ano. Os casos de teste abaixo já trazem o número do sistema e, entre parênteses, o da planilha.

## 6. Alertas para o painel da administradora

- Previsão de fechamento abaixo da meta do mês.
- Lucro do mês negativo.
- Pró-labore acima de 20% do faturamento.
- Saldo de dinheiro ou de banco negativo.
- Margem de lucro do markup fora da faixa do setor.
- Empresa sem lançar há vários dias.

## 7. Casos de teste

**A. Janeiro, caixa diário.** Dinheiro 8.750,00 em cada um de 4 dias (28 a 31). dias_previstos 26, meta 170.000,00.
→ faturamento 35.000,00 · dias_lancados 4 · media_necessaria 6.538,46 · media_realizada 8.750,00 · previsao 227.500,00.

**B. Janeiro, saldos.** Inicial: dinheiro 300,00, banco 3.500,00. Entradas do caso A, sem movimentações.
→ final: dinheiro 35.300,00, banco 3.500,00.

**C. Janeiro, DRE.** Faturamento 35.000,00. Saídas: Pró-labore 5.000 · FGTS+INSS 10.000 · Mercadorias 20.000 · Impostos 3.000 · Despesas financeiras 300 · Marketing 500 · Máquinas 1.000.
→ fixos 15.000,00 (42,86%) · variáveis 23.800,00 (68,00%) · investimentos 1.000,00 (2,86%) · total 39.800,00 · lucro −4.800,00 (−13,71%).

**D. Fevereiro, caixa diário.** Dia 28: Dinheiro 711,00 · Débito 1.588,27 · Crédito 740,78 · Pix 622,36 · Crediário 55,00. dias_previstos 25.
→ faturamento 3.717,41 · participações 19,13% / 42,73% / 19,93% / 16,74% / 1,48% · dias_lancados 1 · previsao 92.935,25.

**E. Fevereiro, saldos.** Inicial: dinheiro 35.300,00, banco 3.500,00. Taxas: débito 1,2%, crédito 10,5%.
→ despesa débito 19,06 · despesa crédito 77,78 · dinheiro final 36.011,00 · banco final 6.354,57 (planilha: 5.732,21, sem o Pix) · crediario_a_receber 55,00.

**F. Fevereiro, DRE.** Sem saídas no livro.
→ Despesas financeiras 96,84 · variáveis 96,84 (2,61%) · lucro 3.620,57 (97,39%) (planilha: 3.717,41).

**G. Ano (janeiro C + fevereiro F).**
→ faturamento 38.717,41 · Dinheiro 92,23% · saídas 39.896,84 · lucro −1.179,43 (−3,05%) (planilha: −1.082,59) · pró-labore 5.000,00 = 12,91% · meses_lancados 2 · média de faturamento 19.358,71.

**H. Markup.** despesa_fixa 24% + margem 9,5% → markup 0,665: custo 5,00 → 7,52; custo 20,50 → 30,83. Só margem 10% → markup 0,90: custo 18,50 → 20,56; custo 20,50 → 22,78. Soma ≥ 100% → erro.

**I. Recebimento de crediário.** Depois do caso E, entrada no livro de 55,00 em dinheiro, origem `recebimento_crediario`.
→ dinheiro +55,00 · faturamento do mês inalterado · crediario_a_receber 0,00.

## 8. Decisões assumidas (a confirmar com a administradora)

| # | Decisão | Onde fica no código |
| --- | --- | --- |
| D1 | Pix e boleto entram no banco no dia do lançamento | `destino` da forma |
| D2 | Crediário conta como faturamento na venda; o pagamento do carnê é entrada no livro | `destino` da forma e `origem` da movimentação |
| D3 | Despesa de cartão entra no DRE em Despesas financeiras | `eh_despesa_financeira` |
| D4 | Dias e meses lançados são calculados | funções de média |
| D5 | Brindes e Permutas somam no faturamento, como o Total da planilha | `conta_faturamento` da forma |
| D6 | Meta = ano anterior × (1 + crescimento); "%" = crescimento do realizado | service de análise |
| D7 | Coluna "Rateio" fica de fora | — |
| D8 | Formas e plano de contas: padrão fixo, empresa pode adicionar | `padrao` |
| D9 | Precificação e análise de faturamento entram depois do livro caixa | ordem das etapas |
