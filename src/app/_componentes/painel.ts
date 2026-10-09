import 'server-only';
import { LIMIARES, alertasDaEmpresa, consolidarLinha, lerPainel } from '@/features/painel';
import { hojeEmSaoPaulo, type Mes } from '@/lib/datas';
import type { ClienteSupabase } from '@/lib/supabase/server';

/** Linhas do painel já consolidadas, com os alertas calculados para hoje. */
export async function carregarPainel(supabase: ClienteSupabase, mes: Mes) {
  const hoje = hojeEmSaoPaulo(new Date());
  return (await lerPainel(supabase, mes)).map((bruta) => {
    const linha = consolidarLinha(bruta);
    return { linha, alertas: alertasDaEmpresa(linha, hoje, LIMIARES) };
  });
}
