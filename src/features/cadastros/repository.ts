import 'server-only';
import { chaveDoMes, mesDe, primeiroDia, type Mes } from '@/lib/datas';
import { centavos } from '@/lib/money';
import { percentual } from '@/lib/percent';
import type { ClienteSupabase } from '@/lib/supabase/server';
import type { Conta, Destino, Forma, Grupo, ParametrosMes, SaldosIniciais } from './service';

export async function listarFormas(sb: ClienteSupabase, empresaId: string): Promise<Forma[]> {
  const { data, error } = await sb
    .from('formas_recebimento')
    .select('id, nome, destino, conta_faturamento, eh_crediario, padrao, ordem, ativa')
    .eq('empresa_id', empresaId)
    .order('ordem')
    .order('nome');
  if (error) throw new Error('Falha ao ler formas de recebimento.');
  return data.map((f) => ({
    id: f.id,
    nome: f.nome,
    destino: f.destino,
    contaFaturamento: f.conta_faturamento,
    ehCrediario: f.eh_crediario,
    padrao: f.padrao,
    ordem: f.ordem,
    ativa: f.ativa,
  }));
}

export async function listarContas(sb: ClienteSupabase, empresaId: string): Promise<Conta[]> {
  const { data, error } = await sb
    .from('plano_contas')
    .select('id, grupo, nome, padrao, eh_pro_labore, eh_despesa_financeira, ordem, ativa')
    .eq('empresa_id', empresaId)
    .order('ordem')
    .order('nome');
  if (error) throw new Error('Falha ao ler o plano de contas.');
  return data.map((c) => ({
    id: c.id,
    grupo: c.grupo,
    nome: c.nome,
    padrao: c.padrao,
    ehProLabore: c.eh_pro_labore,
    ehDespesaFinanceira: c.eh_despesa_financeira,
    ordem: c.ordem,
    ativa: c.ativa,
  }));
}

/** Parâmetros de todos os meses, por chave 'AAAA-MM'. */
export async function listarParametros(
  sb: ClienteSupabase,
  empresaId: string,
): Promise<Record<string, ParametrosMes>> {
  const { data, error } = await sb
    .from('parametros_mes')
    .select('ano, mes, dias_previstos, meta_faturamento, taxa_debito, taxa_credito')
    .eq('empresa_id', empresaId);
  if (error) throw new Error('Falha ao ler os parâmetros do mês.');
  return Object.fromEntries(
    data.map((p) => [
      chaveDoMes({ ano: p.ano, mes: p.mes }),
      {
        diasPrevistos: p.dias_previstos,
        meta: centavos(p.meta_faturamento),
        taxaDebito: percentual(p.taxa_debito),
        taxaCredito: percentual(p.taxa_credito),
      },
    ]),
  );
}

export async function lerSaldosIniciais(
  sb: ClienteSupabase,
  empresaId: string,
): Promise<SaldosIniciais | null> {
  const { data, error } = await sb
    .from('saldos_iniciais')
    .select('data_inicio, saldo_dinheiro, saldo_banco')
    .eq('empresa_id', empresaId)
    .maybeSingle();
  if (error) throw new Error('Falha ao ler os saldos iniciais.');
  return data
    ? {
        mesInicio: mesDe(data.data_inicio),
        dinheiro: centavos(data.saldo_dinheiro),
        banco: centavos(data.saldo_banco),
      }
    : null;
}

export function inserirForma(
  sb: ClienteSupabase,
  empresaId: string,
  forma: { nome: string; destino: Destino; contaFaturamento: boolean },
) {
  return sb.from('formas_recebimento').insert({
    empresa_id: empresaId,
    nome: forma.nome,
    destino: forma.destino,
    conta_faturamento: forma.contaFaturamento,
  });
}

export function atualizarForma(
  sb: ClienteSupabase,
  empresaId: string,
  id: string,
  campos: { nome?: string; ativa?: boolean },
) {
  return sb
    .from('formas_recebimento')
    .update(campos)
    .eq('empresa_id', empresaId)
    .eq('id', id)
    .select('id');
}

export function inserirConta(
  sb: ClienteSupabase,
  empresaId: string,
  conta: { nome: string; grupo: Grupo },
) {
  return sb
    .from('plano_contas')
    .insert({ empresa_id: empresaId, nome: conta.nome, grupo: conta.grupo });
}

export function atualizarConta(
  sb: ClienteSupabase,
  empresaId: string,
  id: string,
  campos: { nome?: string; ativa?: boolean },
) {
  return sb
    .from('plano_contas')
    .update(campos)
    .eq('empresa_id', empresaId)
    .eq('id', id)
    .select('id');
}

export async function salvarParametros(
  sb: ClienteSupabase,
  empresaId: string,
  mes: Mes,
  p: ParametrosMes,
) {
  const valores = {
    dias_previstos: p.diasPrevistos,
    meta_faturamento: p.meta,
    taxa_debito: p.taxaDebito,
    taxa_credito: p.taxaCredito,
  };
  const { data: existente } = await sb
    .from('parametros_mes')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('ano', mes.ano)
    .eq('mes', mes.mes)
    .maybeSingle();
  if (existente) {
    return sb.from('parametros_mes').update(valores).eq('id', existente.id);
  }
  return sb
    .from('parametros_mes')
    .insert({ empresa_id: empresaId, ano: mes.ano, mes: mes.mes, ...valores });
}

export async function salvarSaldosIniciais(
  sb: ClienteSupabase,
  empresaId: string,
  s: SaldosIniciais,
) {
  const valores = {
    data_inicio: primeiroDia(s.mesInicio),
    saldo_dinheiro: s.dinheiro,
    saldo_banco: s.banco,
  };
  const { data: existente } = await sb
    .from('saldos_iniciais')
    .select('id')
    .eq('empresa_id', empresaId)
    .maybeSingle();
  if (existente) {
    return sb.from('saldos_iniciais').update(valores).eq('id', existente.id);
  }
  return sb.from('saldos_iniciais').insert({ empresa_id: empresaId, ...valores });
}
