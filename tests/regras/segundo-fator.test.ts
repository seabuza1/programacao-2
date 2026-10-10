/**
 * Segundo fator configurável (decisão 0008). O global-setup liga a exigência para a suíte;
 * aqui ela é desligada e religada para cobrir os dois modos.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarCenario, type Cenario } from '../apoio/cenario';
import { clienteAnonimo, clienteServico, entrar } from '../apoio/supabase';

let c: Cenario;

async function exigirSegundoFator(valor: boolean): Promise<void> {
  const { error } = await clienteServico()
    .from('configuracao_plataforma')
    .upsert({ id: true, exigir_segundo_fator: valor });
  if (error) throw error;
}

beforeAll(async () => {
  c = await criarCenario();
});

afterAll(async () => {
  await exigirSegundoFator(true);
});

describe('configuracao_plataforma', () => {
  it('cliente logado ou anônimo não lê nem altera', async () => {
    const logado = await entrar(c.operadorA.email);
    for (const cliente of [logado, clienteAnonimo()]) {
      const leitura = await cliente.from('configuracao_plataforma').select('exigir_segundo_fator');
      expect(leitura.error?.code).toBe('42501');
      const escrita = await cliente
        .from('configuracao_plataforma')
        .update({ exigir_segundo_fator: false })
        .eq('id', true);
      expect(escrita.error?.code).toBe('42501');
    }
  });
});

describe('segundo fator desligado', () => {
  beforeAll(async () => {
    await exigirSegundoFator(false);
  });

  it('dono e admin da plataforma não precisam do código', async () => {
    const [dono, admin] = await Promise.all([entrar(c.donoA.email), entrar(c.adminA.email)]);
    expect((await dono.rpc('precisa_mfa')).data).toBe(false);
    expect((await admin.rpc('precisa_mfa')).data).toBe(false);
  });

  it('dono lê a própria empresa só com a senha, e continua sem ler a outra', async () => {
    const dono = await entrar(c.donoA.email);
    const { data } = await dono.from('empresas').select('id');
    expect(data?.map((e) => e.id)).toEqual([c.empresaA]);
    const outra = await dono.from('empresas').select('id').eq('id', c.empresaB);
    expect(outra.data).toEqual([]);
  });

  it('admin da plataforma cria empresa só com a senha', async () => {
    const admin = await entrar(c.adminA.email);
    const { data, error } = await admin.rpc('criar_empresa', { p_nome: 'Criada sem código' });
    expect(error).toBeNull();
    expect(data).toEqual(expect.any(String));
  });

  it('papel continua valendo: operador não cria empresa', async () => {
    const operador = await entrar(c.operadorA.email);
    const { error } = await operador.rpc('criar_empresa', { p_nome: 'Não pode' });
    expect(error?.code).toBe('42501');
  });
});

describe('segundo fator ligado de novo', () => {
  beforeAll(async () => {
    await exigirSegundoFator(true);
  });

  it('dono sem o código volta a não ler dados', async () => {
    const dono = await entrar(c.donoA.email);
    expect((await dono.rpc('precisa_mfa')).data).toBe(true);
    const { data } = await dono.from('empresas').select('id');
    expect(data).toEqual([]);
  });
});

describe('sem a linha de configuração', () => {
  afterAll(async () => {
    await exigirSegundoFator(true);
  });

  it('o segundo fator volta a ser exigido', async () => {
    const { error } = await clienteServico()
      .from('configuracao_plataforma')
      .delete()
      .eq('id', true);
    expect(error).toBeNull();
    const dono = await entrar(c.donoA.email);
    expect((await dono.rpc('precisa_mfa')).data).toBe(true);
  });
});
