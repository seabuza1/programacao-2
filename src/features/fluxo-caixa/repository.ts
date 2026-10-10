import 'server-only';
import { listarEntradas, type Entrada } from '@/features/caixa-diario';
import {
  lerSaldosIniciais,
  listarContas,
  listarFormas,
  listarParametros,
  type Conta,
  type Forma,
  type SaldosIniciais,
} from '@/features/cadastros';
import { primeiroDia, ultimoDia, type Mes } from '@/lib/datas';
import { centavos } from '@/lib/money';
import { buscarTodas } from '@/lib/supabase/paginar';
import type { ClienteSupabase } from '@/lib/supabase/server';
import type { Movimentacao, TaxasPorMes } from './service';

export async function listarMovimentacoes(
  sb: ClienteSupabase,
  empresaId: string,
  de: string | null,
  ate: string,
): Promise<Movimentacao[]> {
  const linhas = await buscarTodas((inicio, fim) => {
    let consulta = sb
      .from('movimentacoes')
      .select('id, data, descricao, tipo, caixa, valor, conta_id, origem, created_at')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .lte('data', ate);
    if (de) consulta = consulta.gte('data', de);
    return consulta.order('data').order('created_at').order('id').range(inicio, fim);
  });
  return linhas.map((m) => ({
    id: m.id,
    data: m.data,
    descricao: m.descricao,
    tipo: m.tipo,
    caixa: m.caixa,
    valor: centavos(m.valor),
    contaId: m.conta_id,
    origem: m.origem,
  }));
}

export interface Historico {
  formas: Forma[];
  contas: Conta[];
  taxas: TaxasPorMes;
  saldosIniciais: SaldosIniciais | null;
  entradas: Entrada[];
  movimentacoes: Movimentacao[];
}

/** Tudo o que o saldo precisa: do mês de início até o fim do mês informado. */
export async function carregarHistorico(
  sb: ClienteSupabase,
  empresaId: string,
  ate: Mes,
): Promise<Historico> {
  const [formas, contas, parametros, saldosIniciais] = await Promise.all([
    listarFormas(sb, empresaId),
    listarContas(sb, empresaId),
    listarParametros(sb, empresaId),
    lerSaldosIniciais(sb, empresaId),
  ]);
  const de = saldosIniciais ? primeiroDia(saldosIniciais.mesInicio) : null;
  const [entradas, movimentacoes] = await Promise.all([
    listarEntradas(sb, empresaId, de, ultimoDia(ate)),
    listarMovimentacoes(sb, empresaId, de, ultimoDia(ate)),
  ]);
  const taxas: TaxasPorMes = Object.fromEntries(
    Object.entries(parametros).map(([chave, p]) => [
      chave,
      { taxaDebito: p.taxaDebito, taxaCredito: p.taxaCredito },
    ]),
  );
  return { formas, contas, taxas, saldosIniciais, entradas, movimentacoes };
}

export function inserirMovimentacao(
  sb: ClienteSupabase,
  empresaId: string,
  m: Omit<Movimentacao, 'id'>,
) {
  return sb.from('movimentacoes').insert({
    empresa_id: empresaId,
    data: m.data,
    descricao: m.descricao,
    tipo: m.tipo,
    caixa: m.caixa,
    valor: m.valor,
    conta_id: m.contaId,
    origem: m.origem,
  });
}

/** Exclusão lógica. */
export function excluirMovimentacao(sb: ClienteSupabase, empresaId: string, id: string) {
  return sb
    .from('movimentacoes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('empresa_id', empresaId)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id');
}
