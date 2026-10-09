import { randomUUID } from 'node:crypto';
import {
  clienteServico,
  criarUsuario,
  entrar,
  type Cliente,
  type Papel,
  type Usuario,
} from './supabase';

export interface Membro extends Usuario {
  precisaMfa: boolean;
  entrar: () => Promise<Cliente>;
}

async function inserirEmpresa(nome: string): Promise<string> {
  const { data, error } = await clienteServico()
    .from('empresas')
    .insert({ nome })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function vincular(usuarioId: string, empresaId: string, papel: Papel): Promise<void> {
  const { error } = await clienteServico()
    .from('vinculos')
    .insert({ usuario_id: usuarioId, empresa_id: empresaId, papel });
  if (error) throw error;
}

async function membro(
  prefixo: string,
  vinculo: { empresaId: string; papel: Papel } | null,
  adminPlataforma = false,
): Promise<Membro> {
  const usuario = await criarUsuario(prefixo, adminPlataforma);
  if (vinculo) {
    await vincular(usuario.id, vinculo.empresaId, vinculo.papel);
  }
  const precisaMfa = adminPlataforma || vinculo?.papel === 'admin' || vinculo?.papel === 'dono';
  return { ...usuario, precisaMfa, entrar: () => entrar(usuario.email, { mfa: precisaMfa }) };
}

/**
 * Duas empresas e um usuário por papel. A admin da plataforma só tem vínculo com a empresa A.
 * Cada chamada cria dados novos, então os testes não dependem de reset.
 */
export async function criarCenario() {
  const sufixo = randomUUID().slice(0, 8);
  const empresaA = await inserirEmpresa(`Empresa A ${sufixo}`);
  const empresaB = await inserirEmpresa(`Empresa B ${sufixo}`);
  return {
    empresaA,
    empresaB,
    adminA: await membro('admin-a', { empresaId: empresaA, papel: 'admin' }, true),
    donoA: await membro('dono-a', { empresaId: empresaA, papel: 'dono' }),
    operadorA: await membro('operador-a', { empresaId: empresaA, papel: 'operador' }),
    leitorA: await membro('leitor-a', { empresaId: empresaA, papel: 'leitor' }),
    donoB: await membro('dono-b', { empresaId: empresaB, papel: 'dono' }),
    operadorB: await membro('operador-b', { empresaId: empresaB, papel: 'operador' }),
    semVinculo: await membro('sem-vinculo', null),
  };
}

export type Cenario = Awaited<ReturnType<typeof criarCenario>>;
