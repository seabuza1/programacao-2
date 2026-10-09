import type { Database } from '@/lib/database.types';
import { diasNoMes, type Mes } from '@/lib/datas';
import { centavos, type Centavos } from '@/lib/money';
import { percentual, type Percentual } from '@/lib/percent';

type Enums = Database['public']['Enums'];
export type Destino = Enums['destino_recebimento'];
export type Grupo = Enums['grupo_conta'];
export type Caixa = Enums['caixa'];

export interface Forma {
  id: string;
  nome: string;
  destino: Destino;
  contaFaturamento: boolean;
  ehCrediario: boolean;
  padrao: boolean;
  ordem: number;
  ativa: boolean;
}

export interface Conta {
  id: string;
  grupo: Grupo;
  nome: string;
  padrao: boolean;
  ehProLabore: boolean;
  ehDespesaFinanceira: boolean;
  ordem: number;
  ativa: boolean;
}

export interface ParametrosMes {
  diasPrevistos: number;
  meta: Centavos;
  taxaDebito: Percentual;
  taxaCredito: Percentual;
}

export interface SaldosIniciais {
  mesInicio: Mes;
  dinheiro: Centavos;
  banco: Centavos;
}

export const DESTINOS: readonly Destino[] = [
  'dinheiro',
  'banco',
  'cartao_debito',
  'cartao_credito',
  'nenhum',
];

export const NOME_DO_DESTINO: Record<Destino, string> = {
  dinheiro: 'Caixa dinheiro',
  banco: 'Banco',
  cartao_debito: 'Banco (cartão de débito)',
  cartao_credito: 'Banco (cartão de crédito)',
  nenhum: 'Não altera saldo',
};

export const GRUPOS: readonly Grupo[] = ['fixo', 'variavel', 'investimento'];

export const NOME_DO_GRUPO: Record<Grupo, string> = {
  fixo: 'Custos fixos',
  variavel: 'Custos variáveis',
  investimento: 'Investimentos',
};

export const NOME_DO_CAIXA: Record<Caixa, string> = { dinheiro: 'Dinheiro', banco: 'Banco' };

/** Para onde vai o dinheiro de uma forma de recebimento. Cartões caem no banco. */
export function caixaDoDestino(destino: Destino): Caixa | null {
  if (destino === 'dinheiro') {
    return 'dinheiro';
  }
  return destino === 'nenhum' ? null : 'banco';
}

export function parametrosVazios(): ParametrosMes {
  return {
    diasPrevistos: 0,
    meta: centavos(0),
    taxaDebito: percentual(0),
    taxaCredito: percentual(0),
  };
}

export function diasPrevistosValidos(dias: number, mes: Mes): boolean {
  return Number.isInteger(dias) && dias >= 0 && dias <= diasNoMes(mes);
}

function porOrdemENome(a: { ordem: number; nome: string }, b: { ordem: number; nome: string }) {
  return a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR');
}

export function ordenarFormas(formas: Forma[]): Forma[] {
  return [...formas].sort(porOrdemENome);
}

export function ordenarContas(contas: Conta[]): Conta[] {
  return [...contas].sort(
    (a, b) => GRUPOS.indexOf(a.grupo) - GRUPOS.indexOf(b.grupo) || porOrdemENome(a, b),
  );
}

/** Item padrão não é renomeado nem apagado, só desativado (decisão D8). */
export function podeRenomear(item: { padrao: boolean }): boolean {
  return !item.padrao;
}
