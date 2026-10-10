import { beforeAll, describe, expect, it } from 'vitest';
import { criarCenario, idPorNome, type Cenario } from '../apoio/cenario';
import { clienteServico, type Cliente } from '../apoio/supabase';

let c: Cenario;
let adminA: Cliente;
let donoA: Cliente;
let operadorA: Cliente;
let forma: string;
let conta: string;

beforeAll(async () => {
  c = await criarCenario();
  [adminA, donoA, operadorA] = await Promise.all([
    c.adminA.entrar(),
    c.donoA.entrar(),
    c.operadorA.entrar(),
  ]);
  forma = await idPorNome('formas_recebimento', c.empresaA, 'Dinheiro');
  conta = await idPorNome('plano_contas', c.empresaA, 'Aluguel');
});

describe('criar_empresa semeia os cadastros padrão', () => {
  it('8 formas e 31 contas, com as marcações certas', async () => {
    const { data: id } = await adminA.rpc('criar_empresa', { p_nome: 'Semeada' });
    const { data: formas } = await adminA
      .from('formas_recebimento')
      .select('nome, destino, eh_crediario, padrao')
      .eq('empresa_id', id!);
    const { data: contas } = await adminA
      .from('plano_contas')
      .select('nome, grupo, eh_pro_labore, eh_despesa_financeira')
      .eq('empresa_id', id!);
    expect(formas).toHaveLength(8);
    expect(contas).toHaveLength(31);
    expect(formas?.find((f) => f.nome === 'Pix')?.destino).toBe('banco');
    expect(formas?.filter((f) => f.eh_crediario).map((f) => f.nome)).toEqual([
      'Crediário Próprio (carnê)',
    ]);
    expect(contas?.filter((x) => x.eh_pro_labore).map((x) => x.nome)).toEqual([
      'Pró-labore dos sócios',
    ]);
    expect(contas?.filter((x) => x.eh_despesa_financeira).map((x) => x.nome)).toEqual([
      'Despesas financeiras',
    ]);
    expect(formas?.every((f) => f.padrao)).toBe(true);
  });
});

describe('itens padrão', () => {
  it('não são renomeados nem apagados, só desativados', async () => {
    const renomear = await donoA
      .from('formas_recebimento')
      .update({ nome: 'Grana' })
      .eq('id', forma);
    expect(renomear.error?.message).toContain('não pode ser renomeado');
    const apagar = await donoA.from('plano_contas').delete().eq('id', conta);
    expect(apagar.error?.message).toContain('não pode ser apagado');
    const desativar = await donoA
      .from('plano_contas')
      .update({ ativa: false })
      .eq('id', conta)
      .select('ativa');
    expect(desativar.data).toEqual([{ ativa: false }]);
    await donoA.from('plano_contas').update({ ativa: true }).eq('id', conta);
  });

  it('cliente não cria item padrão nem muda o destino', async () => {
    const padrao = await donoA
      .from('formas_recebimento')
      .insert({ empresa_id: c.empresaA, nome: 'Falsa', destino: 'banco', padrao: true });
    expect(padrao.error?.code).toBe('42501');
    const destino = await donoA
      .from('formas_recebimento')
      .update({ destino: 'nenhum' })
      .eq('id', forma);
    expect(destino.error?.code).toBe('42501');
  });

  it('item próprio é renomeado', async () => {
    const { data } = await donoA
      .from('formas_recebimento')
      .insert({ empresa_id: c.empresaA, nome: 'Vale', destino: 'banco' })
      .select('id')
      .single();
    const { data: renomeada } = await donoA
      .from('formas_recebimento')
      .update({ nome: 'Vale-presente' })
      .eq('id', data!.id)
      .select('nome');
    expect(renomeada).toEqual([{ nome: 'Vale-presente' }]);
  });
});

describe('movimentações', () => {
  it('saída exige conta; entrada exige origem', async () => {
    const base = {
      empresa_id: c.empresaA,
      data: '2031-03-10',
      caixa: 'banco' as const,
      valor: 100,
    };
    const semConta = await operadorA.from('movimentacoes').insert({ ...base, tipo: 'saida' });
    expect(semConta.error?.code).toBe('23514');
    const semOrigem = await operadorA.from('movimentacoes').insert({ ...base, tipo: 'entrada' });
    expect(semOrigem.error?.code).toBe('23514');
    const transferenciaComConta = await operadorA
      .from('movimentacoes')
      .insert({ ...base, tipo: 'transferencia', conta_id: conta });
    expect(transferenciaComConta.error?.code).toBe('23514');
  });

  it('valor precisa ser positivo', async () => {
    const { error } = await operadorA.from('movimentacoes').insert({
      empresa_id: c.empresaA,
      data: '2031-03-10',
      tipo: 'saida',
      caixa: 'banco',
      valor: -5,
      conta_id: conta,
    });
    expect(error?.code).toBe('23514');
  });

  it('só a exclusão lógica pode ser alterada', async () => {
    const { data } = await operadorA
      .from('movimentacoes')
      .insert({
        empresa_id: c.empresaA,
        data: '2031-03-11',
        tipo: 'saida',
        caixa: 'banco',
        valor: 100,
        conta_id: conta,
      })
      .select('id')
      .single();
    const valor = await operadorA.from('movimentacoes').update({ valor: 1 }).eq('id', data!.id);
    expect(valor.error?.code).toBe('42501');
  });
});

describe('mês fechado', () => {
  const MES = { ano: 2031, mes: 6 };

  it('operador não fecha mês', async () => {
    const { error } = await operadorA
      .from('meses_fechados')
      .insert({ empresa_id: c.empresaA, ...MES });
    expect(error?.code).toBe('42501');
  });

  it('trava lançamentos e parâmetros do mês, inclusive para dono e chave secreta', async () => {
    const { data: entrada } = await operadorA
      .from('entradas_diarias')
      .insert({ empresa_id: c.empresaA, data: '2031-06-10', forma_id: forma, valor: 1000 })
      .select('id')
      .single();
    await donoA
      .from('parametros_mes')
      .insert({ empresa_id: c.empresaA, ...MES, dias_previstos: 20 });

    const fechar = await donoA.from('meses_fechados').insert({ empresa_id: c.empresaA, ...MES });
    expect(fechar.error).toBeNull();

    const tentativas = [
      operadorA
        .from('entradas_diarias')
        .insert({ empresa_id: c.empresaA, data: '2031-06-11', forma_id: forma, valor: 500 }),
      donoA.from('entradas_diarias').update({ valor: 1 }).eq('id', entrada!.id),
      donoA
        .from('entradas_diarias')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', entrada!.id),
      operadorA.from('movimentacoes').insert({
        empresa_id: c.empresaA,
        data: '2031-06-12',
        tipo: 'saida',
        caixa: 'banco',
        valor: 100,
        conta_id: conta,
      }),
      operadorA.from('indicadores_diarios').insert({
        empresa_id: c.empresaA,
        data: '2031-06-12',
        qtd_vendas: 1,
      }),
      donoA
        .from('parametros_mes')
        .update({ dias_previstos: 25 })
        .eq('empresa_id', c.empresaA)
        .eq('ano', MES.ano)
        .eq('mes', MES.mes),
      clienteServico().from('entradas_diarias').update({ valor: 2 }).eq('id', entrada!.id),
    ];
    for (const tentativa of await Promise.all(tentativas)) {
      expect(tentativa.error?.message).toContain('Mês fechado');
    }

    // Consulta direta: só responde sobre empresa com vínculo.
    const consulta = { p_empresa_id: c.empresaA, p_ano: MES.ano, p_mes: MES.mes };
    expect((await operadorA.rpc('mes_fechado', consulta)).data).toBe(true);
    const outraEmpresa = await c.donoB.entrar();
    expect((await outraEmpresa.rpc('mes_fechado', consulta)).data).toBe(false);

    // Mês vizinho continua aberto.
    const vizinho = await operadorA
      .from('entradas_diarias')
      .insert({ empresa_id: c.empresaA, data: '2031-07-01', forma_id: forma, valor: 500 });
    expect(vizinho.error).toBeNull();
  });

  it('saldos iniciais não mudam enquanto houver mês fechado', async () => {
    const { error } = await donoA
      .from('saldos_iniciais')
      .insert({ empresa_id: c.empresaA, data_inicio: '2031-01-01' });
    expect(error?.message).toContain('Há mês fechado');
  });

  it('dono reabre e o lançamento volta a ser aceito', async () => {
    const { data } = await donoA
      .from('meses_fechados')
      .delete()
      .eq('empresa_id', c.empresaA)
      .eq('ano', MES.ano)
      .eq('mes', MES.mes)
      .select('id');
    expect(data).toHaveLength(1);
    const { error } = await operadorA
      .from('entradas_diarias')
      .insert({ empresa_id: c.empresaA, data: '2031-06-11', forma_id: forma, valor: 500 });
    expect(error).toBeNull();
  });
});
