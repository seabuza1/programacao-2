import type { Entrada } from '@/features/caixa-diario';
import {
  NOME_DO_CAIXA,
  caixaDoDestino,
  ordenarFormas,
  type Caixa,
  type Conta,
  type Forma,
  type SaldosIniciais,
} from '@/features/cadastros';
import type { Database } from '@/lib/database.types';
import { chaveDoMes, compararMeses, mesDe, type Mes } from '@/lib/datas';
import { aplicarPercentual, somar, subtrair, ZERO, type Centavos } from '@/lib/money';
import { percentual, type Percentual } from '@/lib/percent';

type Enums = Database['public']['Enums'];
export type TipoMovimentacao = Enums['tipo_movimentacao'];
export type OrigemEntrada = Enums['origem_entrada'];

export interface Movimentacao {
  id: string;
  data: string;
  descricao: string;
  tipo: TipoMovimentacao;
  caixa: Caixa;
  valor: Centavos;
  contaId: string | null;
  origem: OrigemEntrada | null;
}

export interface Saldos {
  dinheiro: Centavos;
  banco: Centavos;
}

export interface Taxas {
  taxaDebito: Percentual;
  taxaCredito: Percentual;
}

/** Taxas de cartão por mês ('AAAA-MM'). Mês sem parâmetro: taxa zero. */
export type TaxasPorMes = Record<string, Taxas>;

const SEM_TAXA: Taxas = { taxaDebito: percentual(0), taxaCredito: percentual(0) };
const SALDOS_ZERO: Saldos = { dinheiro: ZERO, banco: ZERO };

export const NOME_DO_TIPO: Record<TipoMovimentacao, string> = {
  saida: 'Saída',
  entrada: 'Entrada',
  transferencia: 'Transferência',
};

export const NOME_DA_ORIGEM: Record<OrigemEntrada, string> = {
  recebimento_crediario: 'Recebimento de crediário',
  outro: 'Outra entrada',
};

export function taxasDoMes(taxas: TaxasPorMes, data: string): Taxas {
  return taxas[chaveDoMes(mesDe(data))] ?? SEM_TAXA;
}

/** Despesa de cartão de uma entrada, arredondada ao centavo (por dia e por forma). */
export function despesaDeCartao(forma: Forma, valor: Centavos, taxas: Taxas): Centavos {
  if (forma.destino === 'cartao_debito') {
    return aplicarPercentual(valor, taxas.taxaDebito);
  }
  if (forma.destino === 'cartao_credito') {
    return aplicarPercentual(valor, taxas.taxaCredito);
  }
  return ZERO;
}

function somarSaldos(a: Saldos, b: Saldos): Saldos {
  return { dinheiro: somar(a.dinheiro, b.dinheiro), banco: somar(a.banco, b.banco) };
}

function noCaixa(caixa: Caixa, valor: Centavos): Saldos {
  return caixa === 'dinheiro' ? { dinheiro: valor, banco: ZERO } : { dinheiro: ZERO, banco: valor };
}

function negativo(valor: Centavos): Centavos {
  return subtrair(ZERO, valor);
}

/** Efeito da movimentação nos saldos. Transferência sai de `caixa` e entra no outro. */
export function efeitoDaMovimentacao(m: Movimentacao): Saldos {
  if (m.tipo === 'entrada') {
    return noCaixa(m.caixa, m.valor);
  }
  if (m.tipo === 'saida') {
    return noCaixa(m.caixa, negativo(m.valor));
  }
  const outro: Caixa = m.caixa === 'dinheiro' ? 'banco' : 'dinheiro';
  return somarSaldos(noCaixa(m.caixa, negativo(m.valor)), noCaixa(outro, m.valor));
}

interface Lancamentos {
  formas: Forma[];
  entradas: Entrada[];
  movimentacoes: Movimentacao[];
  taxas: TaxasPorMes;
}

/** Soma dos efeitos de entradas automáticas, despesas de cartão e movimentações. */
export function efeitoNosSaldos({ formas, entradas, movimentacoes, taxas }: Lancamentos): Saldos {
  const porId = new Map(formas.map((f) => [f.id, f]));
  let saldos = SALDOS_ZERO;
  for (const entrada of entradas) {
    const forma = porId.get(entrada.formaId);
    const caixa = forma && caixaDoDestino(forma.destino);
    if (!forma || !caixa) continue;
    const despesa = despesaDeCartao(forma, entrada.valor, taxasDoMes(taxas, entrada.data));
    saldos = somarSaldos(saldos, noCaixa(caixa, subtrair(entrada.valor, despesa)));
  }
  for (const m of movimentacoes) {
    saldos = somarSaldos(saldos, efeitoDaMovimentacao(m));
  }
  return saldos;
}

/** Total das despesas de cartão das entradas informadas. */
export function despesasDeCartao(
  formas: Forma[],
  entradas: Entrada[],
  taxas: TaxasPorMes,
): Centavos {
  const porId = new Map(formas.map((f) => [f.id, f]));
  return somar(
    ...entradas.map((e) => {
      const forma = porId.get(e.formaId);
      return forma ? despesaDeCartao(forma, e.valor, taxasDoMes(taxas, e.data)) : ZERO;
    }),
  );
}

function antesDe(mes: Mes) {
  return (item: { data: string }) => compararMeses(mesDe(item.data), mes) < 0;
}

function noMes(mes: Mes) {
  return (item: { data: string }) => compararMeses(mesDe(item.data), mes) === 0;
}

function aPartirDe(inicio: Mes | null) {
  return (item: { data: string }) => !inicio || compararMeses(mesDe(item.data), inicio) >= 0;
}

/**
 * Saldo inicial do mês = saldo final do mês anterior. No primeiro mês, vem de saldos_iniciais.
 * Sem saldos iniciais cadastrados, começa em zero. Antes do mês de início, não há saldo (null).
 */
export function saldoInicialDoMes(
  mes: Mes,
  saldosIniciais: SaldosIniciais | null,
  lancamentos: Lancamentos,
): Saldos | null {
  const inicio = saldosIniciais?.mesInicio ?? null;
  if (inicio && compararMeses(mes, inicio) < 0) {
    return null;
  }
  const anteriores = {
    ...lancamentos,
    entradas: lancamentos.entradas.filter(aPartirDe(inicio)).filter(antesDe(mes)),
    movimentacoes: lancamentos.movimentacoes.filter(aPartirDe(inicio)).filter(antesDe(mes)),
  };
  const base = saldosIniciais
    ? { dinheiro: saldosIniciais.dinheiro, banco: saldosIniciais.banco }
    : SALDOS_ZERO;
  return somarSaldos(base, efeitoNosSaldos(anteriores));
}

export type TipoLinha = 'entrada_automatica' | 'despesa_cartao' | 'movimentacao';

export interface LinhaLivro {
  data: string;
  tipo: TipoLinha;
  descricao: string;
  dinheiro: Centavos;
  banco: Centavos;
  saldoDinheiro: Centavos;
  saldoBanco: Centavos;
  /** Só movimentações são editáveis; o automático muda pelo caixa diário ou pela taxa. */
  movimentacaoId: string | null;
}

export interface LivroDoMes {
  saldoInicial: Saldos;
  linhas: LinhaLivro[];
  saldoFinal: Saldos;
  despesasCartao: Centavos;
}

/** Livro do mês com saldo corrente: automáticos primeiro, depois despesas de cartão e movimentações. */
export function livroDoMes(dados: {
  mes: Mes;
  saldoInicial: Saldos;
  formas: Forma[];
  contas: Conta[];
  entradas: Entrada[];
  movimentacoes: Movimentacao[];
  taxas: TaxasPorMes;
}): LivroDoMes {
  const { mes, saldoInicial, taxas } = dados;
  const formas = ordenarFormas(dados.formas);
  const contas = new Map(dados.contas.map((c) => [c.id, c]));
  const entradas = dados.entradas.filter(noMes(mes));
  const movimentacoes = dados.movimentacoes.filter(noMes(mes));
  const datas = [...new Set([...entradas, ...movimentacoes].map((x) => x.data))].sort();

  const linhas: LinhaLivro[] = [];
  let saldo = saldoInicial;
  let totalDespesas = ZERO;
  const lancar = (linha: Omit<LinhaLivro, 'saldoDinheiro' | 'saldoBanco'>) => {
    saldo = somarSaldos(saldo, { dinheiro: linha.dinheiro, banco: linha.banco });
    linhas.push({ ...linha, saldoDinheiro: saldo.dinheiro, saldoBanco: saldo.banco });
  };

  for (const data of datas) {
    const doDia = entradas.filter((e) => e.data === data);
    const despesas: { forma: Forma; valor: Centavos }[] = [];
    for (const forma of formas) {
      const caixa = caixaDoDestino(forma.destino);
      const valor = somar(...doDia.filter((e) => e.formaId === forma.id).map((e) => e.valor));
      if (!caixa || valor === 0) continue;
      lancar({
        data,
        tipo: 'entrada_automatica',
        descricao: `Caixa diário · ${forma.nome}`,
        ...noCaixa(caixa, valor),
        movimentacaoId: null,
      });
      const despesa = despesaDeCartao(forma, valor, taxasDoMes(taxas, data));
      if (despesa > 0) despesas.push({ forma, valor: despesa });
    }
    for (const { forma, valor } of despesas) {
      totalDespesas = somar(totalDespesas, valor);
      lancar({
        data,
        tipo: 'despesa_cartao',
        descricao: `Taxa · ${forma.nome}`,
        ...noCaixa('banco', negativo(valor)),
        movimentacaoId: null,
      });
    }
    for (const m of movimentacoes.filter((x) => x.data === data)) {
      lancar({
        data,
        tipo: 'movimentacao',
        descricao: descreverMovimentacao(m, contas),
        ...efeitoDaMovimentacao(m),
        movimentacaoId: m.id,
      });
    }
  }
  return { saldoInicial, linhas, saldoFinal: saldo, despesasCartao: totalDespesas };
}

export function descreverMovimentacao(m: Movimentacao, contas: Map<string, Conta>): string {
  const base =
    m.tipo === 'saida'
      ? (contas.get(m.contaId ?? '')?.nome ?? 'Saída')
      : m.tipo === 'entrada'
        ? NOME_DA_ORIGEM[m.origem ?? 'outro']
        : `Transferência ${NOME_DO_CAIXA[m.caixa]} → ${NOME_DO_CAIXA[m.caixa === 'dinheiro' ? 'banco' : 'dinheiro']}`;
  return m.descricao ? `${base} · ${m.descricao}` : base;
}

/**
 * Crediário a receber = vendido no crediário − recebido (entradas com origem recebimento_crediario).
 * Considera tudo até o fim do mês informado.
 */
export function crediarioAReceber(
  ate: Mes,
  formas: Forma[],
  entradas: Entrada[],
  movimentacoes: Movimentacao[],
): Centavos {
  const crediario = new Set(formas.filter((f) => f.ehCrediario).map((f) => f.id));
  const ateOMes = (item: { data: string }) => compararMeses(mesDe(item.data), ate) <= 0;
  const vendido = somar(
    ...entradas.filter((e) => ateOMes(e) && crediario.has(e.formaId)).map((e) => e.valor),
  );
  const recebido = somar(
    ...movimentacoes
      .filter((m) => ateOMes(m) && m.tipo === 'entrada' && m.origem === 'recebimento_crediario')
      .map((m) => m.valor),
  );
  return subtrair(vendido, recebido);
}
