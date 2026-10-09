import { beforeAll, describe, expect, it } from 'vitest';
import { criarCenario, type Cenario } from '../apoio/cenario';
import { criarUsuario, entrar, type Cliente } from '../apoio/supabase';

let c: Cenario;
let adminA: Cliente;
let donoA: Cliente;

beforeAll(async () => {
  c = await criarCenario();
  [adminA, donoA] = await Promise.all([c.adminA.entrar(), c.donoA.entrar()]);
});

describe('pode_convidar', () => {
  it('admin da plataforma convida só para empresa onde é admin', async () => {
    expect((await adminA.rpc('pode_convidar', { p_empresa_id: c.empresaA })).data).toBe(true);
    expect((await adminA.rpc('pode_convidar', { p_empresa_id: c.empresaB })).data).toBe(false);
  });

  it('dono não convida', async () => {
    expect((await donoA.rpc('pode_convidar', { p_empresa_id: c.empresaA })).data).toBe(false);
  });

  it('sem segundo fator não convida', async () => {
    const semMfa = await entrar(c.adminA.email);
    expect((await semMfa.rpc('pode_convidar', { p_empresa_id: c.empresaA })).data).toBe(false);
  });
});

describe('vincular_por_email', () => {
  it('admin da plataforma vincula usuário existente à própria empresa', async () => {
    const novo = await criarUsuario('convidado');
    const { error } = await adminA.rpc('vincular_por_email', {
      p_email: novo.email.toUpperCase(),
      p_empresa_id: c.empresaA,
      p_papel: 'leitor',
    });
    expect(error).toBeNull();
    const convidado = await entrar(novo.email);
    const { data } = await convidado.from('empresas').select('id');
    expect(data?.map((e) => e.id)).toEqual([c.empresaA]);
  });

  it('não vincula a empresa onde não é admin', async () => {
    const { error } = await adminA.rpc('vincular_por_email', {
      p_email: c.semVinculo.email,
      p_empresa_id: c.empresaB,
      p_papel: 'admin',
    });
    expect(error?.code).toBe('42501');
  });

  it('dono não vincula ninguém', async () => {
    const { error } = await donoA.rpc('vincular_por_email', {
      p_email: c.semVinculo.email,
      p_empresa_id: c.empresaA,
      p_papel: 'operador',
    });
    expect(error?.code).toBe('42501');
  });

  it('recusa vínculo repetido', async () => {
    const { error } = await adminA.rpc('vincular_por_email', {
      p_email: c.operadorA.email,
      p_empresa_id: c.empresaA,
      p_papel: 'dono',
    });
    expect(error?.code).toBe('23505');
  });

  it('avisa quando o e-mail não existe', async () => {
    const { error } = await adminA.rpc('vincular_por_email', {
      p_email: 'ninguem@teste.test',
      p_empresa_id: c.empresaA,
      p_papel: 'leitor',
    });
    expect(error?.code).toBe('P0002');
  });
});
