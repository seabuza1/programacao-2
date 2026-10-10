import 'server-only';
import { centavos, ZERO, type Centavos } from '@/lib/money';
import { percentual, type Percentual } from '@/lib/percent';
import type { ClienteSupabase } from '@/lib/supabase/server';

/** Faturamento do ano anterior (12 meses) e crescimento desejado para o ano. */
export async function lerAnalise(
  sb: ClienteSupabase,
  empresaId: string,
  ano: number,
): Promise<{ anterior: Centavos[]; crescimento: Percentual }> {
  const [anterior, meta] = await Promise.all([
    sb
      .from('faturamento_ano_anterior')
      .select('mes, valor')
      .eq('empresa_id', empresaId)
      .eq('ano', ano - 1),
    sb
      .from('metas_anuais')
      .select('crescimento_desejado')
      .eq('empresa_id', empresaId)
      .eq('ano', ano)
      .maybeSingle(),
  ]);
  if (anterior.error || meta.error) throw new Error('Falha ao ler a análise de faturamento.');
  const valores = Array.from({ length: 12 }, () => ZERO);
  for (const linha of anterior.data) {
    valores[linha.mes - 1] = centavos(linha.valor);
  }
  return { anterior: valores, crescimento: percentual(meta.data?.crescimento_desejado ?? 0) };
}

export async function salvarAnalise(
  sb: ClienteSupabase,
  empresaId: string,
  ano: number,
  anterior: Centavos[],
  crescimento: Percentual,
) {
  const { data: existentes, error } = await sb
    .from('faturamento_ano_anterior')
    .select('id, mes')
    .eq('empresa_id', empresaId)
    .eq('ano', ano - 1);
  if (error) return { error };
  const idPorMes = new Map(existentes.map((e) => [e.mes, e.id]));
  const novos = [];
  for (const [i, valor] of anterior.entries()) {
    const id = idPorMes.get(i + 1);
    if (id) {
      const { error: erro } = await sb
        .from('faturamento_ano_anterior')
        .update({ valor })
        .eq('id', id);
      if (erro) return { error: erro };
    } else {
      novos.push({ empresa_id: empresaId, ano: ano - 1, mes: i + 1, valor });
    }
  }
  if (novos.length > 0) {
    const { error: erro } = await sb.from('faturamento_ano_anterior').insert(novos);
    if (erro) return { error: erro };
  }
  const { data: meta } = await sb
    .from('metas_anuais')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('ano', ano)
    .maybeSingle();
  return meta
    ? sb.from('metas_anuais').update({ crescimento_desejado: crescimento }).eq('id', meta.id)
    : sb
        .from('metas_anuais')
        .insert({ empresa_id: empresaId, ano, crescimento_desejado: crescimento });
}
