import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import { TABELAS_DA_EMPRESA } from '@/features/lgpd/service';
import { criarCenario, idPorNome, type Cenario } from '../apoio/cenario';
import { clienteServico, type Cliente } from '../apoio/supabase';

let c: Cenario;
let adminA: Cliente;
let donoA: Cliente;
let nomeA: string;

const servico = () => clienteServico() as unknown as SupabaseClient;

async function contarLinhas(empresaId: string): Promise<Record<string, number>> {
  const contagem: Record<string, number> = {};
  for (const tabela of TABELAS_DA_EMPRESA) {
    const { count } = await servico()
      .from(tabela)
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);
    contagem[tabela] = count ?? 0;
  }
  return contagem;
}

beforeAll(async () => {
  c = await criarCenario();
  [adminA, donoA] = await Promise.all([c.adminA.entrar(), c.donoA.entrar()]);
  const { data } = await servico().from('empresas').select('nome').eq('id', c.empresaA).single();
  nomeA = (data as { nome: string }).nome;
  // Dados em várias tabelas, com mês fechado e auditoria.
  const forma = await idPorNome('formas_recebimento', c.empresaA, 'Dinheiro');
  const conta = await idPorNome('plano_contas', c.empresaA, 'Aluguel');
  const operador = await c.operadorA.entrar();
  for (const [tabela, linha] of [
    [
      'entradas_diarias',
      { empresa_id: c.empresaA, data: '2032-01-10', forma_id: forma, valor: 100 },
    ],
    [
      'movimentacoes',
      {
        empresa_id: c.empresaA,
        data: '2032-01-10',
        tipo: 'saida',
        caixa: 'banco',
        valor: 50,
        conta_id: conta,
      },
    ],
    ['indicadores_diarios', { empresa_id: c.empresaA, data: '2032-01-10', qtd_vendas: 2 }],
  ] as const) {
    const { error } = await (operador as unknown as SupabaseClient).from(tabela).insert(linha);
    if (error) throw error;
  }
  await adminA
    .from('anotacoes')
    .insert({ empresa_id: c.empresaA, texto: 'Teste', visivel_para_empresa: false });
  await donoA.from('meses_fechados').insert({ empresa_id: c.empresaA, ano: 2032, mes: 1 });
});

describe('excluir_empresa', () => {
  it('recusa confirmação diferente do nome', async () => {
    const { error } = await adminA.rpc('excluir_empresa', {
      p_empresa_id: c.empresaA,
      p_confirmacao: 'outro nome',
    });
    expect(error?.message).toContain('Confirmação não confere');
  });

  it('dono não exclui; admin de A não exclui B', async () => {
    const dono = await donoA.rpc('excluir_empresa', {
      p_empresa_id: c.empresaA,
      p_confirmacao: nomeA,
    });
    expect(dono.error?.code).toBe('42501');
    const outra = await adminA.rpc('excluir_empresa', {
      p_empresa_id: c.empresaB,
      p_confirmacao: 'x',
    });
    expect(outra.error?.code).toBe('42501');
  });

  it('fora da exclusão, as travas continuam valendo', async () => {
    const auditoria = await servico().from('auditoria').delete().eq('empresa_id', c.empresaA);
    expect(auditoria.error?.message).toContain('auditoria só aceita insert');
    const fechado = await servico()
      .from('entradas_diarias')
      .delete()
      .eq('empresa_id', c.empresaA)
      .eq('data', '2032-01-10');
    expect(fechado.error?.message).toContain('Mês fechado');
  });

  it('apaga a empresa e tudo dela, e devolve quem ficou sem vínculo', async () => {
    const antes = await contarLinhas(c.empresaA);
    expect(antes.entradas_diarias).toBeGreaterThan(0);
    expect(antes.auditoria).toBeGreaterThan(0);
    const linhasDeB = await contarLinhas(c.empresaB);

    const { data, error } = await adminA.rpc('excluir_empresa', {
      p_empresa_id: c.empresaA,
      p_confirmacao: ` ${nomeA} `,
    });
    expect(error).toBeNull();
    // A admin da plataforma não entra: continua com conta.
    expect([...(data ?? [])].sort()).toEqual([c.donoA.id, c.operadorA.id, c.leitorA.id].sort());

    const depois = await contarLinhas(c.empresaA);
    expect(Object.values(depois).every((n) => n === 0)).toBe(true);
    const { data: empresa } = await servico().from('empresas').select('id').eq('id', c.empresaA);
    expect(empresa).toEqual([]);
    expect(await contarLinhas(c.empresaB)).toEqual(linhasDeB);
  });
});
