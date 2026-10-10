import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarCenario, idPorNome, type Cenario } from '../apoio/cenario';
import { clienteServico, type Cliente } from '../apoio/supabase';

/**
 * Isolamento de todas as tabelas de negócio: usuário de A não lê nem altera linha de B,
 * e cada papel só faz o que pode. Toda tabela nova entra nesta lista.
 */

type Linha = Record<string, unknown>;

interface Refs {
  empresaId: string;
  formaDinheiro: string;
  contaAluguel: string;
}

interface CasoTabela {
  tabela: string;
  /** lancamento: admin, dono e operador escrevem. gestao: só admin e dono. */
  escrita: 'lancamento' | 'gestao';
  linha: (refs: Refs, n: number) => Linha;
  alteracao: Linha;
  /** Lançamentos não aceitam delete; exclusão é lógica. */
  semDelete?: boolean;
}

const CASOS: CasoTabela[] = [
  {
    tabela: 'formas_recebimento',
    escrita: 'gestao',
    linha: (r, n) => ({ empresa_id: r.empresaId, nome: `Forma ${n}`, destino: 'banco' }),
    alteracao: { ativa: false },
  },
  {
    tabela: 'plano_contas',
    escrita: 'gestao',
    linha: (r, n) => ({ empresa_id: r.empresaId, nome: `Conta ${n}`, grupo: 'fixo' }),
    alteracao: { ativa: false },
  },
  {
    tabela: 'parametros_mes',
    escrita: 'gestao',
    linha: (r, n) => ({ empresa_id: r.empresaId, ano: 2000 + n, mes: 1, dias_previstos: 20 }),
    alteracao: { dias_previstos: 22 },
  },
  {
    tabela: 'entradas_diarias',
    escrita: 'lancamento',
    linha: (r, n) => ({
      empresa_id: r.empresaId,
      data: `${2000 + n}-01-15`,
      forma_id: r.formaDinheiro,
      valor: 1000,
    }),
    alteracao: { valor: 2000 },
    semDelete: true,
  },
  {
    tabela: 'indicadores_diarios',
    escrita: 'lancamento',
    linha: (r, n) => ({ empresa_id: r.empresaId, data: `${2000 + n}-01-15`, qtd_vendas: 3 }),
    alteracao: { qtd_vendas: 4 },
    semDelete: true,
  },
  {
    tabela: 'movimentacoes',
    escrita: 'lancamento',
    linha: (r, n) => ({
      empresa_id: r.empresaId,
      data: `${2000 + n}-01-15`,
      tipo: 'saida',
      caixa: 'banco',
      valor: 500,
      conta_id: r.contaAluguel,
    }),
    alteracao: { deleted_at: new Date().toISOString() },
    semDelete: true,
  },
  {
    tabela: 'meses_fechados',
    escrita: 'gestao',
    linha: (r, n) => ({ empresa_id: r.empresaId, ano: 2000 + n, mes: 12 }),
    alteracao: {},
  },
  {
    tabela: 'parametros_markup',
    escrita: 'gestao',
    linha: (r, n) => ({ empresa_id: r.empresaId, ano: 2000 + n, mes: 1, margem_lucro: 1000 }),
    alteracao: { margem_lucro: 950 },
  },
  {
    tabela: 'produtos_preco',
    escrita: 'gestao',
    linha: (r, n) => ({
      empresa_id: r.empresaId,
      ano: 2000 + n,
      mes: 1,
      nome: 'Produto',
      custo: 500,
    }),
    alteracao: { custo: 600 },
  },
  {
    tabela: 'faturamento_ano_anterior',
    escrita: 'gestao',
    linha: (r, n) => ({ empresa_id: r.empresaId, ano: 2000 + n, mes: 1, valor: 100000 }),
    alteracao: { valor: 200000 },
  },
  {
    tabela: 'metas_anuais',
    escrita: 'gestao',
    linha: (r, n) => ({ empresa_id: r.empresaId, ano: 2000 + n, crescimento_desejado: 1000 }),
    alteracao: { crescimento_desejado: 1500 },
  },
];

const semTipo = (cliente: Cliente) => cliente as unknown as SupabaseClient;

let c: Cenario;
let refsA: Refs;
let refsB: Refs;
let clientes: Record<'donoA' | 'operadorA' | 'leitorA' | 'donoB' | 'operadorB', Cliente>;
let contador = 0;

beforeAll(async () => {
  c = await criarCenario();
  const refs = async (empresaId: string): Promise<Refs> => ({
    empresaId,
    formaDinheiro: await idPorNome('formas_recebimento', empresaId, 'Dinheiro'),
    contaAluguel: await idPorNome('plano_contas', empresaId, 'Aluguel'),
  });
  [refsA, refsB] = await Promise.all([refs(c.empresaA), refs(c.empresaB)]);
  const [donoA, operadorA, leitorA, donoB, operadorB] = await Promise.all([
    c.donoA.entrar(),
    c.operadorA.entrar(),
    c.leitorA.entrar(),
    c.donoB.entrar(),
    c.operadorB.entrar(),
  ]);
  clientes = { donoA, operadorA, leitorA, donoB, operadorB };
});

/** Insere como o escritor de A e devolve o id. */
async function inserirEmA(caso: CasoTabela): Promise<string> {
  contador += 1;
  const escritor = caso.escrita === 'lancamento' ? clientes.operadorA : clientes.donoA;
  const { data, error } = await semTipo(escritor)
    .from(caso.tabela)
    .insert(caso.linha(refsA, contador))
    .select('id')
    .single();
  expect(error).toBeNull();
  return (data as { id: string }).id;
}

async function lerComoServico(tabela: string, id: string): Promise<Linha | null> {
  const { data } = await semTipo(clienteServico())
    .from(tabela)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data as Linha | null;
}

describe.each(CASOS)('$tabela', (caso) => {
  it('usuário de B não lê linha de A', async () => {
    const id = await inserirEmA(caso);
    for (const cliente of [clientes.donoB, clientes.operadorB]) {
      const { data } = await semTipo(cliente).from(caso.tabela).select('id').eq('id', id);
      expect(data).toEqual([]);
    }
  });

  it('usuário de A lê a própria linha, inclusive o leitor', async () => {
    const id = await inserirEmA(caso);
    const { data } = await semTipo(clientes.leitorA).from(caso.tabela).select('id').eq('id', id);
    expect(data).toEqual([{ id }]);
  });

  it('usuário de B não altera linha de A', async () => {
    if (Object.keys(caso.alteracao).length === 0) return;
    const id = await inserirEmA(caso);
    const antes = await lerComoServico(caso.tabela, id);
    const { data } = await semTipo(clientes.donoB)
      .from(caso.tabela)
      .update(caso.alteracao)
      .eq('id', id)
      .select('id');
    expect(data ?? []).toEqual([]);
    expect(await lerComoServico(caso.tabela, id)).toEqual(antes);
  });

  it('usuário de B não apaga linha de A', async () => {
    const id = await inserirEmA(caso);
    await semTipo(clientes.donoB).from(caso.tabela).delete().eq('id', id);
    expect(await lerComoServico(caso.tabela, id)).not.toBeNull();
  });

  it('usuário de B não insere linha na empresa A', async () => {
    contador += 1;
    const linha = caso.linha({ ...refsB, empresaId: c.empresaA }, contador);
    const { error } = await semTipo(clientes.donoB).from(caso.tabela).insert(linha);
    expect(error).not.toBeNull();
    expect(['42501', '23503']).toContain(error?.code);
  });

  it('leitor não escreve', async () => {
    contador += 1;
    const { error } = await semTipo(clientes.leitorA)
      .from(caso.tabela)
      .insert(caso.linha(refsA, contador));
    expect(error?.code).toBe('42501');
  });

  if (caso.escrita === 'gestao') {
    it('operador não escreve em cadastro e parâmetro', async () => {
      contador += 1;
      const { error } = await semTipo(clientes.operadorA)
        .from(caso.tabela)
        .insert(caso.linha(refsA, contador));
      expect(error?.code).toBe('42501');
    });
  }

  if (caso.semDelete) {
    it('ninguém apaga lançamento; exclusão é lógica', async () => {
      const id = await inserirEmA(caso);
      const { error } = await semTipo(clientes.donoA).from(caso.tabela).delete().eq('id', id);
      expect(error?.code).toBe('42501');
      expect(await lerComoServico(caso.tabela, id)).not.toBeNull();
    });
  }
});

describe('referências entre empresas', () => {
  it('lançamento de A não usa forma de B', async () => {
    const { error } = await semTipo(clientes.operadorA).from('entradas_diarias').insert({
      empresa_id: c.empresaA,
      data: '2030-01-10',
      forma_id: refsB.formaDinheiro,
      valor: 100,
    });
    expect(error?.code).toBe('23503');
  });

  it('saída de A não usa conta de B', async () => {
    const { error } = await semTipo(clientes.operadorA).from('movimentacoes').insert({
      empresa_id: c.empresaA,
      data: '2030-01-10',
      tipo: 'saida',
      caixa: 'banco',
      valor: 100,
      conta_id: refsB.contaAluguel,
    });
    expect(error?.code).toBe('23503');
  });

  it('linha não muda de empresa', async () => {
    const { data } = await semTipo(clientes.donoA)
      .from('parametros_mes')
      .insert({ empresa_id: c.empresaA, ano: 2099, mes: 5 })
      .select('id')
      .single();
    const { error } = await semTipo(clientes.donoA)
      .from('parametros_mes')
      .update({ empresa_id: c.empresaB })
      .eq('id', (data as { id: string }).id);
    expect(error?.code).toBe('42501');
  });
});

describe('saldos_iniciais', () => {
  // Na empresa B: a A já tem mês fechado nos casos acima, o que trava os saldos iniciais.
  it('um por empresa, invisível para outra empresa', async () => {
    const { error } = await semTipo(clientes.donoB)
      .from('saldos_iniciais')
      .insert({ empresa_id: c.empresaB, data_inicio: '2026-01-01', saldo_dinheiro: 30000 });
    expect(error).toBeNull();
    const deA = await semTipo(clientes.donoA)
      .from('saldos_iniciais')
      .select('id')
      .eq('empresa_id', c.empresaB);
    expect(deA.data).toEqual([]);
    const operador = await semTipo(clientes.operadorB)
      .from('saldos_iniciais')
      .update({ saldo_banco: 1 })
      .eq('empresa_id', c.empresaB)
      .select('id');
    expect(operador.data ?? []).toEqual([]);
    const invasao = await semTipo(clientes.donoA)
      .from('saldos_iniciais')
      .update({ saldo_banco: 1 })
      .eq('empresa_id', c.empresaB)
      .select('id');
    expect(invasao.data ?? []).toEqual([]);
  });
});
