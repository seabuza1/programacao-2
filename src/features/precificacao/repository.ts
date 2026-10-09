import 'server-only';
import type { Mes } from '@/lib/datas';
import { centavos } from '@/lib/money';
import { percentual } from '@/lib/percent';
import type { ClienteSupabase } from '@/lib/supabase/server';
import type { ParametrosMarkup, ProdutoPreco } from './service';

export async function lerParametrosMarkup(
  sb: ClienteSupabase,
  empresaId: string,
  mes: Mes,
): Promise<ParametrosMarkup | null> {
  const { data, error } = await sb
    .from('parametros_markup')
    .select('taxa_cartao, despesa_fixa, imposto, comissao, investimentos, margem_lucro')
    .eq('empresa_id', empresaId)
    .eq('ano', mes.ano)
    .eq('mes', mes.mes)
    .maybeSingle();
  if (error) throw new Error('Falha ao ler os parâmetros de markup.');
  return data
    ? {
        taxaCartao: percentual(data.taxa_cartao),
        despesaFixa: percentual(data.despesa_fixa),
        imposto: percentual(data.imposto),
        comissao: percentual(data.comissao),
        investimentos: percentual(data.investimentos),
        margemLucro: percentual(data.margem_lucro),
      }
    : null;
}

export async function salvarParametrosMarkup(
  sb: ClienteSupabase,
  empresaId: string,
  mes: Mes,
  p: ParametrosMarkup,
) {
  const valores = {
    taxa_cartao: p.taxaCartao,
    despesa_fixa: p.despesaFixa,
    imposto: p.imposto,
    comissao: p.comissao,
    investimentos: p.investimentos,
    margem_lucro: p.margemLucro,
  };
  const { data: existente } = await sb
    .from('parametros_markup')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('ano', mes.ano)
    .eq('mes', mes.mes)
    .maybeSingle();
  if (existente) {
    return sb.from('parametros_markup').update(valores).eq('id', existente.id);
  }
  return sb
    .from('parametros_markup')
    .insert({ empresa_id: empresaId, ano: mes.ano, mes: mes.mes, ...valores });
}

export async function listarProdutos(
  sb: ClienteSupabase,
  empresaId: string,
  mes: Mes,
): Promise<ProdutoPreco[]> {
  const { data, error } = await sb
    .from('produtos_preco')
    .select(
      'id, nome, custo, frete, embalagem, imposto_entrada, preco_trabalhado, preco_concorrente',
    )
    .eq('empresa_id', empresaId)
    .eq('ano', mes.ano)
    .eq('mes', mes.mes)
    .order('nome');
  if (error) throw new Error('Falha ao ler os produtos.');
  const opcional = (v: number | null) => (v === null ? null : centavos(v));
  return data.map((p) => ({
    id: p.id,
    nome: p.nome,
    custo: centavos(p.custo),
    frete: centavos(p.frete),
    embalagem: centavos(p.embalagem),
    impostoEntrada: centavos(p.imposto_entrada),
    precoTrabalhado: opcional(p.preco_trabalhado),
    precoConcorrente: opcional(p.preco_concorrente),
  }));
}

export function inserirProduto(
  sb: ClienteSupabase,
  empresaId: string,
  mes: Mes,
  p: Omit<ProdutoPreco, 'id'>,
) {
  return sb.from('produtos_preco').insert({
    empresa_id: empresaId,
    ano: mes.ano,
    mes: mes.mes,
    nome: p.nome,
    custo: p.custo,
    frete: p.frete,
    embalagem: p.embalagem,
    imposto_entrada: p.impostoEntrada,
    preco_trabalhado: p.precoTrabalhado,
    preco_concorrente: p.precoConcorrente,
  });
}

export function excluirProduto(sb: ClienteSupabase, empresaId: string, id: string) {
  return sb.from('produtos_preco').delete().eq('empresa_id', empresaId).eq('id', id).select('id');
}
