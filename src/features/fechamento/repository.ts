import 'server-only';
import { chaveDoMes, type Mes } from '@/lib/datas';
import type { ClienteSupabase } from '@/lib/supabase/server';

/** Chaves 'AAAA-MM' dos meses fechados. */
export async function listarMesesFechados(
  sb: ClienteSupabase,
  empresaId: string,
): Promise<Set<string>> {
  const { data, error } = await sb
    .from('meses_fechados')
    .select('ano, mes')
    .eq('empresa_id', empresaId);
  if (error) throw new Error('Falha ao ler os meses fechados.');
  return new Set(data.map((m) => chaveDoMes(m)));
}

export function fecharMes(sb: ClienteSupabase, empresaId: string, mes: Mes) {
  return sb.from('meses_fechados').insert({ empresa_id: empresaId, ano: mes.ano, mes: mes.mes });
}

export function reabrirMes(sb: ClienteSupabase, empresaId: string, mes: Mes) {
  return sb
    .from('meses_fechados')
    .delete()
    .eq('empresa_id', empresaId)
    .eq('ano', mes.ano)
    .eq('mes', mes.mes)
    .select('id');
}
