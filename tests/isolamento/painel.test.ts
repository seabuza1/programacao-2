import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import { consolidarLinha, type LinhaBruta } from '@/features/painel/service';
import { centavos } from '@/lib/money';
import { percentual } from '@/lib/percent';
import { criarCenario, idPorNome, type Cenario } from '../apoio/cenario';
import { clienteServico, type Cliente } from '../apoio/supabase';

let c: Cenario;
let adminA: Cliente;
let donoA: Cliente;
let operadorA: Cliente;
let leitorA: Cliente;
let donoB: Cliente;
let operadorB: Cliente;

beforeAll(async () => {
  c = await criarCenario();
  [adminA, donoA, operadorA, leitorA, donoB, operadorB] = await Promise.all([
    c.adminA.entrar(),
    c.donoA.entrar(),
    c.operadorA.entrar(),
    c.leitorA.entrar(),
    c.donoB.entrar(),
    c.operadorB.entrar(),
  ]);
  // Empresa A com os dados dos casos A, D e E de docs/dominio.md.
  const servico = clienteServico() as unknown as SupabaseClient;
  const inserir = async (tabela: string, linhas: object | object[]) => {
    const { error } = await servico.from(tabela).insert(linhas);
    if (error) throw new Error(`${tabela}: ${error.message}`);
  };
  const forma = (nome: string) => idPorNome('formas_recebimento', c.empresaA, nome);
  await inserir('saldos_iniciais', {
    empresa_id: c.empresaA,
    data_inicio: '2026-01-01',
    saldo_dinheiro: 30000,
    saldo_banco: 350000,
  });
  await inserir('parametros_mes', [
    {
      empresa_id: c.empresaA,
      ano: 2026,
      mes: 1,
      dias_previstos: 26,
      meta_faturamento: 17000000,
      taxa_debito: 0,
      taxa_credito: 0,
    },
    {
      empresa_id: c.empresaA,
      ano: 2026,
      mes: 2,
      dias_previstos: 25,
      meta_faturamento: 0,
      taxa_debito: 120,
      taxa_credito: 1050,
    },
  ]);
  const dinheiro = await forma('Dinheiro');
  await inserir('entradas_diarias', [
    ...['28', '29', '30', '31'].map((dia) => ({
      empresa_id: c.empresaA,
      data: `2026-01-${dia}`,
      forma_id: dinheiro,
      valor: 875000,
    })),
    { empresa_id: c.empresaA, data: '2026-02-28', forma_id: dinheiro, valor: 71100 },
    {
      empresa_id: c.empresaA,
      data: '2026-02-28',
      forma_id: await forma('Cartão Débito'),
      valor: 158827,
    },
    {
      empresa_id: c.empresaA,
      data: '2026-02-28',
      forma_id: await forma('Cartão Crédito'),
      valor: 74078,
    },
    { empresa_id: c.empresaA, data: '2026-02-28', forma_id: await forma('Pix'), valor: 62236 },
    {
      empresa_id: c.empresaA,
      data: '2026-02-28',
      forma_id: await forma('Crediário Próprio (carnê)'),
      valor: 5500,
    },
  ]);
});

async function painel(cliente: Cliente, ano: number, mes: number) {
  const { data, error } = await cliente.rpc('painel_empresas', { p_ano: ano, p_mes: mes });
  expect(error).toBeNull();
  return data ?? [];
}

describe('painel_empresas', () => {
  it('cada usuário vê só as empresas em que tem vínculo', async () => {
    expect((await painel(donoA, 2026, 2)).map((l) => l.empresa_id)).toEqual([c.empresaA]);
    expect((await painel(donoB, 2026, 2)).map((l) => l.empresa_id)).toEqual([c.empresaB]);
    expect((await painel(adminA, 2026, 2)).map((l) => l.empresa_id)).toContain(c.empresaA);
    expect((await painel(adminA, 2026, 2)).map((l) => l.empresa_id)).not.toContain(c.empresaB);
  });

  it('bate com os casos D, E e F (fevereiro)', async () => {
    const [l] = (await painel(donoA, 2026, 2)).filter((x) => x.empresa_id === c.empresaA);
    const bruta: LinhaBruta = {
      empresaId: l!.empresa_id,
      nome: l!.nome,
      setor: null,
      saldoInicialDinheiro: centavos(l!.saldo_inicial_dinheiro),
      saldoInicialBanco: centavos(l!.saldo_inicial_banco),
      entradasDinheiro: centavos(l!.entradas_dinheiro),
      entradasBanco: centavos(l!.entradas_banco),
      taxasCartao: centavos(l!.taxas_cartao),
      movimentoDinheiro: centavos(l!.movimento_dinheiro),
      movimentoBanco: centavos(l!.movimento_banco),
      faturamentoMes: centavos(l!.faturamento_mes),
      saidasMes: centavos(l!.saidas_mes),
      taxasCartaoMes: centavos(l!.taxas_cartao_mes),
      proLaboreMes: centavos(l!.pro_labore_mes),
      diasLancadosMes: l!.dias_lancados_mes,
      diasPrevistos: l!.dias_previstos,
      meta: centavos(l!.meta_faturamento),
      ultimoLancamento: l!.ultimo_lancamento,
      margemLucro: l!.margem_lucro === null ? null : percentual(l!.margem_lucro),
    };
    // Taxas arredondadas por lançamento no banco: 19,06 + 77,78.
    expect(l!.taxas_cartao_mes).toBe(1906 + 7778);
    const linha = consolidarLinha(bruta);
    expect(linha.faturamento).toBe(371741);
    expect(linha.saldoDinheiro).toBe(3601100);
    expect(linha.saldoBanco).toBe(635457);
    expect(linha.lucro).toBe(362057);
    expect(linha.previsao).toBe(9293525);
    expect(linha.ultimoLancamento).toBe('2026-02-28');
  });

  it('janeiro: saldo final do caso B e previsão do caso A', async () => {
    const [l] = (await painel(donoA, 2026, 1)).filter((x) => x.empresa_id === c.empresaA);
    expect(l!.saldo_inicial_dinheiro + l!.entradas_dinheiro + l!.movimento_dinheiro).toBe(3530000);
    expect(l!.faturamento_mes).toBe(3500000);
    expect(l!.dias_lancados_mes).toBe(4);
  });

  it('anônimo não chama', async () => {
    const { clienteAnonimo } = await import('../apoio/supabase');
    const { error } = await clienteAnonimo().rpc('painel_empresas', { p_ano: 2026, p_mes: 2 });
    expect(error?.code).toBe('42501');
  });
});

describe('anotacoes', () => {
  it('só a admin escreve', async () => {
    const admin = await adminA
      .from('anotacoes')
      .insert({ empresa_id: c.empresaA, texto: 'Interna', visivel_para_empresa: false });
    expect(admin.error).toBeNull();
    const visivel = await adminA
      .from('anotacoes')
      .insert({ empresa_id: c.empresaA, texto: 'Para a empresa', visivel_para_empresa: true });
    expect(visivel.error).toBeNull();
    for (const cliente of [donoA, operadorA, leitorA, donoB]) {
      const { error } = await cliente
        .from('anotacoes')
        .insert({ empresa_id: c.empresaA, texto: 'Não pode', visivel_para_empresa: true });
      expect(error?.code).toBe('42501');
    }
  });

  it('a empresa vê só as visíveis; a admin vê todas; outra empresa não vê nada', async () => {
    const textos = async (cliente: Cliente) =>
      ((await cliente.from('anotacoes').select('texto').eq('empresa_id', c.empresaA)).data ?? [])
        .map((a) => a.texto)
        .sort();
    expect(await textos(adminA)).toEqual(['Interna', 'Para a empresa']);
    expect(await textos(donoA)).toEqual(['Para a empresa']);
    expect(await textos(leitorA)).toEqual(['Para a empresa']);
    expect(await textos(operadorB)).toEqual([]);
  });

  it('histórico sem edição destrutiva: ninguém altera nem apaga', async () => {
    const alterar = await adminA
      .from('anotacoes')
      .update({ texto: 'x' })
      .eq('empresa_id', c.empresaA);
    expect(alterar.error?.code).toBe('42501');
    const apagar = await adminA.from('anotacoes').delete().eq('empresa_id', c.empresaA);
    expect(apagar.error?.code).toBe('42501');
  });
});

describe('gestão de vínculos', () => {
  const vinculoDe = async (usuarioId: string, empresaId: string) => {
    const { data } = await clienteServico()
      .from('vinculos')
      .select('id, papel')
      .eq('usuario_id', usuarioId)
      .eq('empresa_id', empresaId)
      .single();
    return data!;
  };

  it('admin troca papel e remove acesso na própria empresa', async () => {
    const leitor = await vinculoDe(c.leitorA.id, c.empresaA);
    expect(
      (await adminA.rpc('alterar_vinculo', { p_vinculo_id: leitor.id, p_papel: 'operador' })).error,
    ).toBeNull();
    expect((await vinculoDe(c.leitorA.id, c.empresaA)).papel).toBe('operador');
    expect(
      (await adminA.rpc('alterar_vinculo', { p_vinculo_id: leitor.id, p_papel: 'leitor' })).error,
    ).toBeNull();
  });

  it('a empresa nunca fica sem admin', async () => {
    const admin = await vinculoDe(c.adminA.id, c.empresaA);
    const rebaixar = await adminA.rpc('alterar_vinculo', {
      p_vinculo_id: admin.id,
      p_papel: 'dono',
    });
    expect(rebaixar.error?.message).toContain('pelo menos uma administradora');
    const remover = await adminA.rpc('remover_vinculo', { p_vinculo_id: admin.id });
    expect(remover.error?.message).toContain('pelo menos uma administradora');
  });

  it('dono não gerencia vínculos; admin de A não mexe em B', async () => {
    const operador = await vinculoDe(c.operadorA.id, c.empresaA);
    expect((await donoA.rpc('remover_vinculo', { p_vinculo_id: operador.id })).error?.code).toBe(
      '42501',
    );
    const deB = await vinculoDe(c.operadorB.id, c.empresaB);
    expect((await adminA.rpc('remover_vinculo', { p_vinculo_id: deB.id })).error?.code).toBe(
      '42501',
    );
    expect(
      (await adminA.rpc('alterar_vinculo', { p_vinculo_id: deB.id, p_papel: 'admin' })).error?.code,
    ).toBe('42501');
  });
});

describe('setor da empresa', () => {
  it('dono altera; operador e outra empresa não', async () => {
    const dono = await donoA
      .from('empresas')
      .update({ setor: 'comercio' })
      .eq('id', c.empresaA)
      .select('setor');
    expect(dono.data).toEqual([{ setor: 'comercio' }]);
    const operador = await operadorA
      .from('empresas')
      .update({ setor: 'servicos' })
      .eq('id', c.empresaA)
      .select('id');
    expect(operador.data ?? []).toEqual([]);
    const outra = await donoB
      .from('empresas')
      .update({ setor: 'servicos' })
      .eq('id', c.empresaA)
      .select('id');
    expect(outra.data ?? []).toEqual([]);
  });
});
