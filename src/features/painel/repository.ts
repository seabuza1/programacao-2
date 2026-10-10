import 'server-only';
import type { Setor } from '@/features/precificacao';
import type { Mes } from '@/lib/datas';
import { centavos } from '@/lib/money';
import { percentual } from '@/lib/percent';
import type { ClienteSupabase } from '@/lib/supabase/server';
import type { LinhaBruta } from './service';

/** Uma consulta agregada; o RLS limita às empresas com vínculo. */
export async function lerPainel(sb: ClienteSupabase, mes: Mes): Promise<LinhaBruta[]> {
  const { data, error } = await sb.rpc('painel_empresas', { p_ano: mes.ano, p_mes: mes.mes });
  if (error) throw new Error('Falha ao ler o painel.');
  return data.map((l) => ({
    empresaId: l.empresa_id,
    nome: l.nome,
    setor: (l.setor as Setor | null) ?? null,
    saldoInicialDinheiro: centavos(l.saldo_inicial_dinheiro),
    saldoInicialBanco: centavos(l.saldo_inicial_banco),
    entradasDinheiro: centavos(l.entradas_dinheiro),
    entradasBanco: centavos(l.entradas_banco),
    taxasCartao: centavos(l.taxas_cartao),
    movimentoDinheiro: centavos(l.movimento_dinheiro),
    movimentoBanco: centavos(l.movimento_banco),
    faturamentoMes: centavos(l.faturamento_mes),
    saidasMes: centavos(l.saidas_mes),
    taxasCartaoMes: centavos(l.taxas_cartao_mes),
    proLaboreMes: centavos(l.pro_labore_mes),
    diasLancadosMes: l.dias_lancados_mes,
    diasPrevistos: l.dias_previstos,
    meta: centavos(l.meta_faturamento),
    ultimoLancamento: l.ultimo_lancamento,
    margemLucro: l.margem_lucro === null ? null : percentual(l.margem_lucro),
  }));
}
