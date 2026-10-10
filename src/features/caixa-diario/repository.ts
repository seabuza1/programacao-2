import 'server-only';
import { centavos, type Centavos } from '@/lib/money';
import { buscarTodas } from '@/lib/supabase/paginar';
import type { ClienteSupabase } from '@/lib/supabase/server';
import type { Entrada, Indicador } from './service';

/** Entradas ativas (sem exclusão lógica) entre duas datas, inclusive. */
export async function listarEntradas(
  sb: ClienteSupabase,
  empresaId: string,
  de: string | null,
  ate: string,
): Promise<Entrada[]> {
  const linhas = await buscarTodas((inicio, fim) => {
    let consulta = sb
      .from('entradas_diarias')
      .select('id, data, forma_id, valor')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .lte('data', ate);
    if (de) consulta = consulta.gte('data', de);
    return consulta.order('id').range(inicio, fim);
  });
  return linhas.map((e) => ({ data: e.data, formaId: e.forma_id, valor: centavos(e.valor) }));
}

export async function listarIndicadores(
  sb: ClienteSupabase,
  empresaId: string,
  de: string,
  ate: string,
): Promise<Indicador[]> {
  const { data, error } = await sb
    .from('indicadores_diarios')
    .select('data, qtd_vendas, qtd_produtos, descontos')
    .eq('empresa_id', empresaId)
    .is('deleted_at', null)
    .gte('data', de)
    .lte('data', ate);
  if (error) throw new Error('Falha ao ler os indicadores do dia.');
  return data.map((i) => ({
    data: i.data,
    qtdVendas: i.qtd_vendas,
    qtdProdutos: i.qtd_produtos,
    descontos: centavos(i.descontos),
  }));
}

/** Grava o valor do dia para a forma. Valor vazio ou zero exclui (logicamente) o lançamento. */
export async function salvarEntrada(
  sb: ClienteSupabase,
  empresaId: string,
  entrada: { data: string; formaId: string; valor: Centavos | null },
) {
  const { data: existente, error } = await sb
    .from('entradas_diarias')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('data', entrada.data)
    .eq('forma_id', entrada.formaId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) return { error };
  if (!entrada.valor) {
    return existente
      ? sb
          .from('entradas_diarias')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', existente.id)
      : { error: null };
  }
  if (existente) {
    return sb.from('entradas_diarias').update({ valor: entrada.valor }).eq('id', existente.id);
  }
  return sb.from('entradas_diarias').insert({
    empresa_id: empresaId,
    data: entrada.data,
    forma_id: entrada.formaId,
    valor: entrada.valor,
  });
}

export async function salvarIndicador(
  sb: ClienteSupabase,
  empresaId: string,
  indicador: Indicador,
) {
  const { data: existente, error } = await sb
    .from('indicadores_diarios')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('data', indicador.data)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) return { error };
  const valores = {
    qtd_vendas: indicador.qtdVendas,
    qtd_produtos: indicador.qtdProdutos,
    descontos: indicador.descontos,
  };
  const vazio = !indicador.qtdVendas && !indicador.qtdProdutos && !indicador.descontos;
  if (vazio) {
    return existente
      ? sb
          .from('indicadores_diarios')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', existente.id)
      : { error: null };
  }
  if (existente) {
    return sb.from('indicadores_diarios').update(valores).eq('id', existente.id);
  }
  return sb
    .from('indicadores_diarios')
    .insert({ empresa_id: empresaId, data: indicador.data, ...valores });
}
