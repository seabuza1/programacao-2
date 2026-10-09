/**
 * Casos de teste da seção 7 de docs/dominio.md, com os mesmos números.
 * Onde o sistema difere da planilha (seção 5), vale o número do sistema.
 */
import { describe, expect, it } from 'vitest';
import { resumirCaixaDiario } from '@/features/caixa-diario';
import type { ParametrosMes, SaldosIniciais } from '@/features/cadastros';
import {
  crediarioAReceber,
  despesasDeCartao,
  livroDoMes,
  saldoInicialDoMes,
  type Movimentacao,
  type TaxasPorMes,
} from '@/features/fluxo-caixa';
import { calcularMarkup, precoSugerido } from '@/features/precificacao';
import {
  gerencialDoMes,
  proLaboreDoAno,
  relatorioAnual,
  saidasPorConta,
  type DadosDoMes,
} from '@/features/relatorios';
import { somar } from '@/lib/money';
import { percentual } from '@/lib/percent';
import { CONTAS, FORMAS, entrada, r, saida } from './padrao';

const JANEIRO = { ano: 2026, mes: 1 };
const FEVEREIRO = { ano: 2026, mes: 2 };
const p = percentual;

const parametros = (diasPrevistos: number, meta: number): ParametrosMes => ({
  diasPrevistos,
  meta: r(meta),
  taxaDebito: p(0),
  taxaCredito: p(0),
});

// Caso A: Dinheiro 8.750,00 em cada um de 4 dias (28 a 31 de janeiro).
const entradasJaneiro = ['28', '29', '30', '31'].map((dia) =>
  entrada(`2026-01-${dia}`, 'dinheiro', 8750),
);

// Caso D: dia 28 de fevereiro.
const entradasFevereiro = [
  entrada('2026-02-28', 'dinheiro', 711),
  entrada('2026-02-28', 'debito', 1588.27),
  entrada('2026-02-28', 'credito', 740.78),
  entrada('2026-02-28', 'pix', 622.36),
  entrada('2026-02-28', 'crediario', 55),
];

// Caso B: saldos iniciais em janeiro.
const saldosIniciais: SaldosIniciais = { mesInicio: JANEIRO, dinheiro: r(300), banco: r(3500) };

// Caso E: taxas de fevereiro.
const taxas: TaxasPorMes = { '2026-02': { taxaDebito: p(120), taxaCredito: p(1050) } };

// Caso C: saídas de janeiro.
const saidasJaneiro: Movimentacao[] = [
  saida('2026-01-31', 'pro_labore', 5000),
  saida('2026-01-31', 'fgts', 10000),
  saida('2026-01-31', 'mercadorias', 20000),
  saida('2026-01-31', 'impostos', 3000),
  saida('2026-01-31', 'financeiras', 300),
  saida('2026-01-31', 'marketing', 500),
  saida('2026-01-31', 'maquinas', 1000),
];

describe('A. Janeiro, caixa diário', () => {
  const resumo = resumirCaixaDiario({
    mes: JANEIRO,
    formas: FORMAS,
    entradas: entradasJaneiro,
    indicadores: [],
    parametros: parametros(26, 170000),
  });

  it('faturamento 35.000,00 · dias_lancados 4', () => {
    expect(resumo.faturamento).toBe(r(35000));
    expect(resumo.diasLancados).toBe(4);
  });

  it('media_necessaria 6.538,46 · media_realizada 8.750,00 · previsão 227.500,00', () => {
    expect(resumo.mediaNecessaria).toBe(r(6538.46));
    expect(resumo.mediaRealizada).toBe(r(8750));
    expect(resumo.previsao).toBe(r(227500));
  });
});

describe('B. Janeiro, saldos', () => {
  it('final: dinheiro 35.300,00, banco 3.500,00', () => {
    const inicial = saldoInicialDoMes(JANEIRO, saldosIniciais, {
      formas: FORMAS,
      entradas: entradasJaneiro,
      movimentacoes: [],
      taxas,
    });
    expect(inicial).toEqual({ dinheiro: r(300), banco: r(3500) });
    const livro = livroDoMes({
      mes: JANEIRO,
      saldoInicial: inicial!,
      formas: FORMAS,
      contas: CONTAS,
      entradas: entradasJaneiro,
      movimentacoes: [],
      taxas,
    });
    expect(livro.saldoFinal).toEqual({ dinheiro: r(35300), banco: r(3500) });
  });
});

describe('C. Janeiro, DRE', () => {
  const dre = gerencialDoMes({
    contas: CONTAS,
    movimentacoes: saidasJaneiro,
    despesasCartao: r(0),
    faturamento: r(35000),
  });
  const grupo = (g: string) => dre.grupos.find((x) => x.grupo === g)!;

  it('fixos 15.000,00 (42,86%) · variáveis 23.800,00 (68,00%) · investimentos 1.000,00 (2,86%)', () => {
    expect([grupo('fixo').total, grupo('fixo').percentual]).toEqual([r(15000), p(4286)]);
    expect([grupo('variavel').total, grupo('variavel').percentual]).toEqual([r(23800), p(6800)]);
    expect([grupo('investimento').total, grupo('investimento').percentual]).toEqual([
      r(1000),
      p(286),
    ]);
  });

  it('total 39.800,00 · lucro −4.800,00 (−13,71%)', () => {
    expect(dre.totalSaidas).toBe(r(39800));
    expect(dre.lucro).toBe(r(-4800));
    expect(dre.percentualLucro).toBe(p(-1371));
  });
});

describe('D. Fevereiro, caixa diário', () => {
  const resumo = resumirCaixaDiario({
    mes: FEVEREIRO,
    formas: FORMAS,
    entradas: entradasFevereiro,
    indicadores: [],
    parametros: parametros(25, 0),
  });

  it('faturamento 3.717,41 · dias_lancados 1 · previsão 92.935,25', () => {
    expect(resumo.faturamento).toBe(r(3717.41));
    expect(resumo.diasLancados).toBe(1);
    expect(resumo.previsao).toBe(r(92935.25));
  });

  it('participações 19,13% / 42,73% / 19,93% / 16,74% / 1,48%', () => {
    const { participacao } = resumo;
    expect(
      ['dinheiro', 'debito', 'credito', 'pix', 'crediario'].map((id) => participacao[id]),
    ).toEqual([p(1913), p(4273), p(1993), p(1674), p(148)]);
  });
});

const lancamentosAteFevereiro = {
  formas: FORMAS,
  entradas: [...entradasJaneiro, ...entradasFevereiro],
  movimentacoes: [] as Movimentacao[],
  taxas,
};

function livroDeFevereiro(movimentacoes: Movimentacao[] = []) {
  const dados = { ...lancamentosAteFevereiro, movimentacoes };
  return livroDoMes({
    mes: FEVEREIRO,
    saldoInicial: saldoInicialDoMes(FEVEREIRO, saldosIniciais, dados)!,
    contas: CONTAS,
    ...dados,
  });
}

describe('E. Fevereiro, saldos', () => {
  it('saldo inicial = final de janeiro (35.300,00 e 3.500,00)', () => {
    expect(livroDeFevereiro().saldoInicial).toEqual({ dinheiro: r(35300), banco: r(3500) });
  });

  it('despesa débito 19,06 · despesa crédito 77,78', () => {
    const livro = livroDeFevereiro();
    const taxasDoDia = livro.linhas.filter((l) => l.tipo === 'despesa_cartao').map((l) => l.banco);
    expect(taxasDoDia).toEqual([r(-19.06), r(-77.78)]);
  });

  it('dinheiro final 36.011,00 · banco final 6.354,57 (planilha: 5.732,21, sem o Pix)', () => {
    expect(livroDeFevereiro().saldoFinal).toEqual({ dinheiro: r(36011), banco: r(6354.57) });
  });

  it('crediario_a_receber 55,00', () => {
    expect(crediarioAReceber(FEVEREIRO, FORMAS, entradasFevereiro, [])).toBe(r(55));
  });
});

describe('F. Fevereiro, DRE', () => {
  const despesas = despesasDeCartao(FORMAS, entradasFevereiro, taxas);
  const dre = gerencialDoMes({
    contas: CONTAS,
    movimentacoes: [],
    despesasCartao: despesas,
    faturamento: r(3717.41),
  });

  it('Despesas financeiras 96,84 · variáveis 96,84 (2,61%)', () => {
    const variaveis = dre.grupos.find((g) => g.grupo === 'variavel')!;
    expect(variaveis.contas.find((c) => c.conta.id === 'financeiras')?.total).toBe(r(96.84));
    expect([variaveis.total, variaveis.percentual]).toEqual([r(96.84), p(261)]);
  });

  it('lucro 3.620,57 (97,39%) (planilha: 3.717,41)', () => {
    expect([dre.lucro, dre.percentualLucro]).toEqual([r(3620.57), p(9739)]);
  });
});

describe('G. Ano (janeiro C + fevereiro F)', () => {
  const porForma = (entradas: typeof entradasJaneiro) =>
    Object.fromEntries(
      FORMAS.map((f) => [
        f.id,
        somar(...entradas.filter((e) => e.formaId === f.id).map((e) => e.valor)),
      ]),
    );
  const meses: DadosDoMes[] = [
    {
      faturamento: r(35000),
      entradasPorForma: porForma(entradasJaneiro),
      saidasPorConta: saidasPorConta(CONTAS, saidasJaneiro, r(0)),
    },
    {
      faturamento: r(3717.41),
      entradasPorForma: porForma(entradasFevereiro),
      saidasPorConta: saidasPorConta(
        CONTAS,
        [],
        despesasDeCartao(FORMAS, entradasFevereiro, taxas),
      ),
    },
  ];
  const anual = relatorioAnual({ formas: FORMAS, contas: CONTAS, meses });

  it('faturamento 38.717,41 · Dinheiro 92,23%', () => {
    expect(anual.faturamento.total).toBe(r(38717.41));
    expect(anual.entradas.find((l) => l.id === 'dinheiro')?.percentual).toBe(p(9223));
  });

  it('saídas 39.896,84 · lucro −1.179,43 (−3,05%) (planilha: −1.082,59)', () => {
    expect(anual.totalSaidas.total).toBe(r(39896.84));
    expect([anual.lucro.total, anual.lucro.percentual]).toEqual([r(-1179.43), p(-305)]);
  });

  it('pró-labore 5.000,00 = 12,91%', () => {
    const { ano } = proLaboreDoAno(CONTAS, meses);
    expect([ano.retiradas, ano.percentual]).toEqual([r(5000), p(1291)]);
  });

  it('meses_lancados 2 · média de faturamento 19.358,71', () => {
    expect(anual.mesesLancados).toBe(2);
    expect(anual.faturamento.media).toBe(r(19358.71));
  });
});

describe('H. Markup', () => {
  const zero = { taxaCartao: p(0), imposto: p(0), comissao: p(0), investimentos: p(0) };

  it('despesa fixa 24% + margem 9,5% → markup 0,665: 5,00 → 7,52; 20,50 → 30,83', () => {
    const markup = calcularMarkup({ ...zero, despesaFixa: p(2400), margemLucro: p(950) });
    expect(markup).toEqual({ ok: true, soma: p(3350), markup: p(6650) });
    expect(precoSugerido(r(5), markup)).toBe(r(7.52));
    expect(precoSugerido(r(20.5), markup)).toBe(r(30.83));
  });

  it('só margem 10% → markup 0,90: 18,50 → 20,56; 20,50 → 22,78', () => {
    const markup = calcularMarkup({ ...zero, despesaFixa: p(0), margemLucro: p(1000) });
    expect(markup).toMatchObject({ ok: true, markup: p(9000) });
    expect(precoSugerido(r(18.5), markup)).toBe(r(20.56));
    expect(precoSugerido(r(20.5), markup)).toBe(r(22.78));
  });

  it('soma ≥ 100% → erro e nenhum preço', () => {
    const markup = calcularMarkup({ ...zero, despesaFixa: p(6000), margemLucro: p(4000) });
    expect(markup.ok).toBe(false);
    expect(precoSugerido(r(10), markup)).toBeNull();
  });
});

describe('I. Recebimento de crediário', () => {
  const recebimento: Movimentacao = {
    id: 'carne',
    data: '2026-02-28',
    descricao: '',
    tipo: 'entrada',
    caixa: 'dinheiro',
    valor: r(55),
    contaId: null,
    origem: 'recebimento_crediario',
  };

  it('dinheiro +55,00', () => {
    expect(livroDeFevereiro([recebimento]).saldoFinal).toEqual({
      dinheiro: r(36011 + 55),
      banco: r(6354.57),
    });
  });

  it('faturamento do mês inalterado', () => {
    const resumo = resumirCaixaDiario({
      mes: FEVEREIRO,
      formas: FORMAS,
      entradas: entradasFevereiro,
      indicadores: [],
      parametros: parametros(25, 0),
    });
    expect(resumo.faturamento).toBe(r(3717.41));
  });

  it('crediario_a_receber 0,00', () => {
    expect(crediarioAReceber(FEVEREIRO, FORMAS, entradasFevereiro, [recebimento])).toBe(r(0));
  });
});
