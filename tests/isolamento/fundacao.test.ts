import { beforeAll, describe, expect, it } from 'vitest';
import { criarCenario, type Cenario } from '../apoio/cenario';
import { clienteAnonimo, clienteServico, entrar, type Cliente } from '../apoio/supabase';

let c: Cenario;
let donoA: Cliente;
let operadorA: Cliente;
let leitorA: Cliente;
let adminA: Cliente;
let donoB: Cliente;
let semVinculo: Cliente;

beforeAll(async () => {
  c = await criarCenario();
  [donoA, operadorA, leitorA, adminA, donoB, semVinculo] = await Promise.all([
    c.donoA.entrar(),
    c.operadorA.entrar(),
    c.leitorA.entrar(),
    c.adminA.entrar(),
    c.donoB.entrar(),
    c.semVinculo.entrar(),
  ]);
});

async function nomeDaEmpresa(id: string): Promise<string> {
  const { data } = await clienteServico().from('empresas').select('nome').eq('id', id).single();
  return data?.nome ?? '';
}

describe('anônimo', () => {
  it('não lê nenhuma tabela', async () => {
    const anonimo = clienteAnonimo();
    for (const tabela of ['empresas', 'usuarios', 'vinculos', 'auditoria'] as const) {
      const { data, error } = await anonimo.from(tabela).select('id');
      expect(error?.code).toBe('42501');
      expect(data).toBeNull();
    }
  });

  it('não chama funções', async () => {
    const { error } = await clienteAnonimo().rpc('criar_empresa', { p_nome: 'Invasora' });
    expect(error?.code).toBe('42501');
  });
});

describe('empresas', () => {
  it('cada usuário lê só a própria empresa', async () => {
    for (const cliente of [donoA, operadorA, leitorA]) {
      const { data } = await cliente.from('empresas').select('id');
      expect(data?.map((e) => e.id)).toEqual([c.empresaA]);
    }
    const { data } = await donoB.from('empresas').select('id');
    expect(data?.map((e) => e.id)).toEqual([c.empresaB]);
  });

  it('usuário de A não lê B pelo id', async () => {
    const { data } = await operadorA.from('empresas').select('id').eq('id', c.empresaB);
    expect(data).toEqual([]);
  });

  it('usuário sem vínculo não lê nada', async () => {
    const { data } = await semVinculo.from('empresas').select('id');
    expect(data).toEqual([]);
  });

  it('admin da plataforma lê só onde tem vínculo', async () => {
    const { data } = await adminA.from('empresas').select('id');
    expect(data?.map((e) => e.id)).toEqual([c.empresaA]);
  });

  it('dono de B não altera A', async () => {
    const antes = await nomeDaEmpresa(c.empresaA);
    const { data } = await donoB
      .from('empresas')
      .update({ nome: 'Invadida' })
      .eq('id', c.empresaA)
      .select('id');
    expect(data).toEqual([]);
    expect(await nomeDaEmpresa(c.empresaA)).toBe(antes);
  });

  it('operador e leitor não alteram a própria empresa', async () => {
    for (const cliente of [operadorA, leitorA]) {
      const { data } = await cliente
        .from('empresas')
        .update({ nome: 'Alterada' })
        .eq('id', c.empresaA)
        .select('id');
      expect(data).toEqual([]);
    }
  });

  it('dono altera o nome da própria empresa', async () => {
    const { data, error } = await donoA
      .from('empresas')
      .update({ nome: 'Empresa A renomeada' })
      .eq('id', c.empresaA)
      .select('nome');
    expect(error).toBeNull();
    expect(data).toEqual([{ nome: 'Empresa A renomeada' }]);
  });

  it('ninguém insere nem apaga empresa direto', async () => {
    const insercao = await adminA.from('empresas').insert({ nome: 'Direta' });
    expect(insercao.error?.code).toBe('42501');
    const exclusao = await donoA.from('empresas').delete().eq('id', c.empresaA);
    expect(exclusao.error?.code).toBe('42501');
  });
});

describe('criar_empresa', () => {
  it('admin da plataforma cria empresa e já nasce com vínculo admin', async () => {
    const { data: id, error } = await adminA.rpc('criar_empresa', { p_nome: '  Nova Ltda  ' });
    expect(error).toBeNull();
    const { data: empresa } = await adminA.from('empresas').select('nome').eq('id', id!).single();
    expect(empresa?.nome).toBe('Nova Ltda');
    const { data: vinculo } = await adminA
      .from('vinculos')
      .select('papel, usuario_id')
      .eq('empresa_id', id!)
      .single();
    expect(vinculo).toEqual({ papel: 'admin', usuario_id: c.adminA.id });
  });

  it('quem não é admin da plataforma não cria', async () => {
    for (const cliente of [donoA, operadorA, semVinculo]) {
      const { error } = await cliente.rpc('criar_empresa', { p_nome: 'Não pode' });
      expect(error?.code).toBe('42501');
    }
  });

  it('admin da plataforma sem segundo fator não cria', async () => {
    const semMfa = await entrar(c.adminA.email);
    const { error } = await semMfa.rpc('criar_empresa', { p_nome: 'Sem MFA' });
    expect(error?.code).toBe('42501');
  });
});

describe('segundo fator', () => {
  it('dono sem segundo fator não lê dados da empresa', async () => {
    const semMfa = await entrar(c.donoA.email);
    const { data } = await semMfa.from('empresas').select('id');
    expect(data).toEqual([]);
  });

  it('operador não precisa de segundo fator', async () => {
    const { data } = await operadorA.from('empresas').select('id');
    expect(data).toHaveLength(1);
  });

  it('precisa_mfa reflete o papel', async () => {
    expect((await donoA.rpc('precisa_mfa')).data).toBe(true);
    expect((await adminA.rpc('precisa_mfa')).data).toBe(true);
    expect((await operadorA.rpc('precisa_mfa')).data).toBe(false);
    expect((await leitorA.rpc('precisa_mfa')).data).toBe(false);
  });
});

describe('usuarios', () => {
  it('lê a si mesmo e os colegas de empresa, nunca os de outra empresa', async () => {
    const { data } = await operadorA.from('usuarios').select('id');
    const ids = data?.map((u) => u.id) ?? [];
    expect(ids).toContain(c.operadorA.id);
    expect(ids).toContain(c.donoA.id);
    expect(ids).not.toContain(c.donoB.id);
    expect(ids).not.toContain(c.operadorB.id);
    expect(ids).not.toContain(c.semVinculo.id);
  });

  it('usuário sem vínculo lê só a si mesmo', async () => {
    const { data } = await semVinculo.from('usuarios').select('id');
    expect(data?.map((u) => u.id)).toEqual([c.semVinculo.id]);
  });

  it('altera o próprio nome, mas não o de outro', async () => {
    const proprio = await operadorA
      .from('usuarios')
      .update({ nome: 'Operadora A' })
      .eq('id', c.operadorA.id)
      .select('nome');
    expect(proprio.data).toEqual([{ nome: 'Operadora A' }]);
    const outro = await operadorA
      .from('usuarios')
      .update({ nome: 'Invadido' })
      .eq('id', c.donoA.id)
      .select('id');
    expect(outro.data).toEqual([]);
  });

  it('ninguém se promove a admin da plataforma', async () => {
    for (const cliente of [donoA, operadorA, semVinculo]) {
      const { error } = await cliente
        .from('usuarios')
        .update({ admin_plataforma: true })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      expect(error?.code).toBe('42501');
    }
    const { data } = await clienteServico()
      .from('usuarios')
      .select('admin_plataforma')
      .in('id', [c.donoA.id, c.operadorA.id, c.semVinculo.id]);
    expect(data?.every((u) => !u.admin_plataforma)).toBe(true);
  });
});

describe('vinculos', () => {
  it('operador e leitor veem só o próprio vínculo', async () => {
    const { data } = await operadorA.from('vinculos').select('usuario_id');
    expect(data).toEqual([{ usuario_id: c.operadorA.id }]);
  });

  it('dono vê os vínculos da própria empresa e nenhum de B', async () => {
    const { data } = await donoA.from('vinculos').select('empresa_id');
    expect(data?.length).toBeGreaterThanOrEqual(4);
    expect(data?.every((v) => v.empresa_id === c.empresaA)).toBe(true);
  });

  it('ninguém cria, altera ou apaga vínculo direto', async () => {
    const criar = await semVinculo
      .from('vinculos')
      .insert({ usuario_id: c.semVinculo.id, empresa_id: c.empresaB, papel: 'admin' });
    expect(criar.error?.code).toBe('42501');
    const promover = await operadorA
      .from('vinculos')
      .update({ papel: 'dono' })
      .eq('usuario_id', c.operadorA.id);
    expect(promover.error?.code).toBe('42501');
    const apagar = await donoA.from('vinculos').delete().eq('empresa_id', c.empresaA);
    expect(apagar.error?.code).toBe('42501');
  });
});

describe('auditoria', () => {
  it('registra a alteração de empresa com o autor', async () => {
    await donoA.from('empresas').update({ nome: 'Auditada' }).eq('id', c.empresaA);
    const { data } = await donoA
      .from('auditoria')
      .select('tabela, operacao, created_by, depois')
      .eq('registro_id', c.empresaA)
      .eq('operacao', 'UPDATE')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    expect(data).toMatchObject({ tabela: 'empresas', created_by: c.donoA.id });
    expect((data?.depois as { nome: string }).nome).toBe('Auditada');
  });

  it('dono de A não lê a auditoria de B', async () => {
    const { data } = await donoA.from('auditoria').select('empresa_id');
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.every((linha) => linha.empresa_id === c.empresaA)).toBe(true);
  });

  it('operador e leitor não leem auditoria', async () => {
    for (const cliente of [operadorA, leitorA]) {
      const { data } = await cliente.from('auditoria').select('id');
      expect(data).toEqual([]);
    }
  });

  it('cliente não insere na auditoria', async () => {
    const { error } = await donoA.from('auditoria').insert({
      empresa_id: c.empresaA,
      tabela: 'empresas',
      registro_id: c.empresaA,
      operacao: 'UPDATE',
    });
    expect(error?.code).toBe('42501');
  });

  it('nem a chave de serviço altera ou apaga auditoria', async () => {
    const servico = clienteServico();
    const alterar = await servico
      .from('auditoria')
      .update({ tabela: 'x' })
      .eq('empresa_id', c.empresaA);
    expect(alterar.error?.message).toContain('auditoria só aceita insert');
    const apagar = await servico.from('auditoria').delete().eq('empresa_id', c.empresaA);
    expect(apagar.error?.message).toContain('auditoria só aceita insert');
  });
});
