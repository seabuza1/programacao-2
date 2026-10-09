import {
  GRUPOS,
  NOME_DO_GRUPO,
  ordenarContas,
  ordenarFormas,
  type Conta,
  type Forma,
  type Grupo,
} from '@/features/cadastros';
import {
  faturamento as faturamentoDe,
  resumirCaixaDiario,
  type Entrada,
} from '@/features/caixa-diario';
import type { ParametrosMes, SaldosIniciais } from '@/features/cadastros';
import {
  crediarioAReceber,
  despesasDeCartao,
  livroDoMes,
  saldoInicialDoMes,
  type Movimentacao,
  type TaxasPorMes,
} from '@/features/fluxo-caixa';
import { compararMeses, mesDe, type Mes } from '@/lib/datas';
import { aplicarPercentual, dividir, somar, subtrair, ZERO, type Centavos } from '@/lib/money';
import { percentual, razao, type Percentual } from '@/lib/percent';

// Gerencial e DRE do mês -----------------------------------------------------

/**
 * Saídas por conta. A conta marcada como despesa financeira soma também as despesas
 * automáticas de cartão (decisão D3).
 */
export function saidasPorConta(
  contas: Conta[],
  movimentacoes: Movimentacao[],
  despesasCartao: Centavos,
): Record<string, Centavos> {
  const totais: Record<string, Centavos> = {};
  for (const m of movimentacoes) {
    if (m.tipo === 'saida' && m.contaId) {
      totais[m.contaId] = somar(totais[m.contaId] ?? ZERO, m.valor);
    }
  }
  const financeira = contas.find((c) => c.ehDespesaFinanceira);
  if (financeira && despesasCartao > 0) {
    totais[financeira.id] = somar(totais[financeira.id] ?? ZERO, despesasCartao);
  }
  return totais;
}

export interface LinhaConta {
  conta: Conta;
  total: Centavos;
  percentual: Percentual | null;
}

export interface GrupoGerencial {
  grupo: Grupo;
  nome: string;
  total: Centavos;
  percentual: Percentual | null;
  contas: LinhaConta[];
}

export interface Gerencial {
  faturamento: Centavos;
  grupos: GrupoGerencial[];
  totalSaidas: Centavos;
  percentualSaidas: Percentual | null;
  lucro: Centavos;
  percentualLucro: Percentual | null;
}

/** DRE simplificado: lucro = faturamento − fixos − variáveis − investimentos. */
export function gerencialDoMes(dados: {
  contas: Conta[];
  movimentacoes: Movimentacao[];
  despesasCartao: Centavos;
  faturamento: Centavos;
}): Gerencial {
  const { faturamento } = dados;
  const totais = saidasPorConta(dados.contas, dados.movimentacoes, dados.despesasCartao);
  const contas = ordenarContas(dados.contas);
  const grupos = GRUPOS.map((grupo): GrupoGerencial => {
    const linhas = contas
      .filter((c) => c.grupo === grupo)
      .map((conta) => {
        const total = totais[conta.id] ?? ZERO;
        return { conta, total, percentual: razao(total, faturamento) };
      })
      .filter((linha) => linha.conta.ativa || linha.total > 0);
    const total = somar(...linhas.map((l) => l.total));
    return {
      grupo,
      nome: NOME_DO_GRUPO[grupo],
      total,
      percentual: razao(total, faturamento),
      contas: linhas,
    };
  });
  const totalSaidas = somar(...grupos.map((g) => g.total));
  const lucro = subtrair(faturamento, totalSaidas);
  return {
    faturamento,
    grupos,
    totalSaidas,
    percentualSaidas: razao(totalSaidas, faturamento),
    lucro,
    percentualLucro: razao(lucro, faturamento),
  };
}

// Relatório anual ------------------------------------------------------------

export interface DadosDoMes {
  faturamento: Centavos;
  entradasPorForma: Record<string, Centavos>;
  saidasPorConta: Record<string, Centavos>;
}

export interface LinhaAnual {
  id: string;
  nome: string;
  meses: Centavos[];
  total: Centavos;
  media: Centavos | null;
  percentual: Percentual | null;
}

export interface RelatorioAnual {
  mesesLancados: number;
  faturamento: LinhaAnual;
  entradas: LinhaAnual[];
  saidas: (LinhaAnual & { grupo: Grupo })[];
  grupos: (LinhaAnual & { grupo: Grupo })[];
  totalSaidas: LinhaAnual;
  lucro: LinhaAnual;
}

/** Uma coluna por mês, mais Total e Média. Média = total ÷ meses com faturamento. */
export function relatorioAnual(dados: {
  formas: Forma[];
  contas: Conta[];
  meses: DadosDoMes[];
}): RelatorioAnual {
  const meses = Array.from({ length: 12 }, (_, i) => dados.meses[i] ?? vazio());
  const mesesLancados = meses.filter((m) => m.faturamento > 0).length;
  const faturamentoAno = somar(...meses.map((m) => m.faturamento));
  const linha = (id: string, nome: string, valores: Centavos[]): LinhaAnual => {
    const total = somar(...valores);
    return {
      id,
      nome,
      meses: valores,
      total,
      media: dividir(total, mesesLancados),
      percentual: razao(total, faturamentoAno),
    };
  };

  // Itens desativados só aparecem se tiverem valor no ano.
  const entradas = ordenarFormas(dados.formas)
    .map((f) => ({
      f,
      l: linha(
        f.id,
        f.nome,
        meses.map((m) => m.entradasPorForma[f.id] ?? ZERO),
      ),
    }))
    .filter(({ f, l }) => f.ativa || l.total > 0)
    .map(({ l }) => l);
  const saidas = ordenarContas(dados.contas)
    .map((c) => ({
      c,
      l: linha(
        c.id,
        c.nome,
        meses.map((m) => m.saidasPorConta[c.id] ?? ZERO),
      ),
    }))
    .filter(({ c, l }) => c.ativa || l.total > 0)
    .map(({ c, l }) => ({ ...l, grupo: c.grupo }));
  const grupos = GRUPOS.map((grupo) => ({
    ...linha(
      grupo,
      NOME_DO_GRUPO[grupo],
      meses.map((_, i) =>
        somar(...saidas.filter((s) => s.grupo === grupo).map((s) => s.meses[i] ?? ZERO)),
      ),
    ),
    grupo,
  }));
  const saidasPorMes = meses.map((_, i) => somar(...grupos.map((g) => g.meses[i] ?? ZERO)));
  return {
    mesesLancados,
    faturamento: linha(
      'faturamento',
      'Faturamento',
      meses.map((m) => m.faturamento),
    ),
    entradas,
    saidas,
    grupos,
    totalSaidas: linha('saidas', 'Total de saídas', saidasPorMes),
    lucro: linha(
      'lucro',
      'Lucro',
      meses.map((m, i) => subtrair(m.faturamento, saidasPorMes[i] ?? ZERO)),
    ),
  };
}

function vazio(): DadosDoMes {
  return { faturamento: ZERO, entradasPorForma: {}, saidasPorConta: {} };
}

// Pró-labore -------------------------------------------------------------------

/** Orientação da planilha: no máximo 20% do faturamento. */
export const LIMITE_PRO_LABORE = percentual(2_000);

export interface ProLaboreMes {
  retiradas: Centavos;
  faturamento: Centavos;
  percentual: Percentual | null;
  acimaDoLimite: boolean;
}

export function proLaboreDoMes(retiradas: Centavos, faturamento: Centavos): ProLaboreMes {
  const pct = razao(retiradas, faturamento);
  return {
    retiradas,
    faturamento,
    percentual: pct,
    acimaDoLimite: retiradas > 0 && (pct === null || pct > LIMITE_PRO_LABORE),
  };
}

export function proLaboreDoAno(contas: Conta[], meses: DadosDoMes[]) {
  const conta = contas.find((c) => c.ehProLabore);
  const porMes = Array.from({ length: 12 }, (_, i) => {
    const mes = meses[i] ?? vazio();
    return proLaboreDoMes(conta ? (mes.saidasPorConta[conta.id] ?? ZERO) : ZERO, mes.faturamento);
  });
  return {
    meses: porMes,
    ano: proLaboreDoMes(
      somar(...porMes.map((m) => m.retiradas)),
      somar(...porMes.map((m) => m.faturamento)),
    ),
  };
}

// Análise de faturamento -------------------------------------------------------

export interface AnaliseMes {
  anterior: Centavos;
  meta: Centavos;
  realizado: Centavos;
  /** realizado ÷ anterior − 1. null se não há ano anterior. */
  crescimento: Percentual | null;
}

function crescimento(realizado: Centavos, anterior: Centavos): Percentual | null {
  const proporcao = razao(realizado, anterior);
  return proporcao === null ? null : percentual(proporcao - 10_000);
}

/** Meta = ano anterior × (1 + crescimento desejado) (decisão D6). Média = total ÷ 12. */
export function analiseFaturamento(dados: {
  anterior: Centavos[];
  realizado: Centavos[];
  crescimentoDesejado: Percentual;
}) {
  const meses = Array.from({ length: 12 }, (_, i): AnaliseMes => {
    const anterior = dados.anterior[i] ?? ZERO;
    const realizado = dados.realizado[i] ?? ZERO;
    return {
      anterior,
      meta: somar(anterior, aplicarPercentual(anterior, dados.crescimentoDesejado)),
      realizado,
      crescimento: crescimento(realizado, anterior),
    };
  });
  const total = {
    anterior: somar(...meses.map((m) => m.anterior)),
    meta: somar(...meses.map((m) => m.meta)),
    realizado: somar(...meses.map((m) => m.realizado)),
  };
  return {
    meses,
    total: { ...total, crescimento: crescimento(total.realizado, total.anterior) },
    media: {
      anterior: dividir(total.anterior, 12),
      meta: dividir(total.meta, 12),
      realizado: dividir(total.realizado, 12),
    },
  };
}

// Consolidação ------------------------------------------------------------------

export interface Historico {
  formas: Forma[];
  contas: Conta[];
  taxas: TaxasPorMes;
  saldosIniciais: SaldosIniciais | null;
  entradas: Entrada[];
  movimentacoes: Movimentacao[];
}

function doMes<T extends { data: string }>(itens: T[], mes: Mes): T[] {
  return itens.filter((item) => compararMeses(mesDe(item.data), mes) === 0);
}

/** Tudo o que as telas mostram de um mês: caixa diário, livro, DRE e crediário. */
export function resumoDoMes(historico: Historico, mes: Mes, parametros: ParametrosMes) {
  const { formas, contas, taxas } = historico;
  const entradas = doMes(historico.entradas, mes);
  const movimentacoes = doMes(historico.movimentacoes, mes);
  const caixa = resumirCaixaDiario({ mes, formas, entradas, indicadores: [], parametros });
  const saldoInicial = saldoInicialDoMes(mes, historico.saldosIniciais, historico);
  const livro = saldoInicial
    ? livroDoMes({ mes, saldoInicial, formas, contas, entradas, movimentacoes, taxas })
    : null;
  const despesasCartao = despesasDeCartao(formas, entradas, taxas);
  return {
    caixa,
    livro,
    despesasCartao,
    gerencial: gerencialDoMes({
      contas,
      movimentacoes,
      despesasCartao,
      faturamento: caixa.faturamento,
    }),
    crediario: crediarioAReceber(mes, formas, historico.entradas, historico.movimentacoes),
  };
}

/** Os 12 meses do ano no formato do relatório anual. */
export function dadosDoAno(historico: Historico, ano: number): DadosDoMes[] {
  return Array.from({ length: 12 }, (_, i) => {
    const mes = { ano, mes: i + 1 };
    const entradas = doMes(historico.entradas, mes);
    const entradasPorForma: Record<string, Centavos> = {};
    for (const e of entradas) {
      entradasPorForma[e.formaId] = somar(entradasPorForma[e.formaId] ?? ZERO, e.valor);
    }
    return {
      faturamento: faturamentoDe(historico.formas, entradas),
      entradasPorForma,
      saidasPorConta: saidasPorConta(
        historico.contas,
        doMes(historico.movimentacoes, mes),
        despesasDeCartao(historico.formas, entradas, historico.taxas),
      ),
    };
  });
}
