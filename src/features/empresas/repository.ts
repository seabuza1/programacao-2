import 'server-only';
import type { Setor } from '@/features/precificacao';
import type { ClienteSupabase } from '@/lib/supabase/server';

export interface Empresa {
  id: string;
  nome: string;
  setor: Setor | null;
}

/** Empresas com vínculo (RLS). */
export async function listarEmpresas(sb: ClienteSupabase): Promise<Empresa[]> {
  const { data, error } = await sb.from('empresas').select('id, nome, setor').order('nome');
  if (error) throw new Error('Falha ao ler as empresas.');
  return data.map((e) => ({ id: e.id, nome: e.nome, setor: (e.setor as Setor | null) ?? null }));
}

export async function lerEmpresa(sb: ClienteSupabase, id: string): Promise<Empresa | null> {
  const { data } = await sb.from('empresas').select('id, nome, setor').eq('id', id).maybeSingle();
  return data
    ? { id: data.id, nome: data.nome, setor: (data.setor as Setor | null) ?? null }
    : null;
}

/** criar_empresa confere admin_plataforma e cria o vínculo admin na mesma transação. */
export function criarEmpresa(sb: ClienteSupabase, nome: string) {
  return sb.rpc('criar_empresa', { p_nome: nome });
}

export function atualizarEmpresa(
  sb: ClienteSupabase,
  id: string,
  campos: { nome: string; setor: Setor | null },
) {
  return sb.from('empresas').update(campos).eq('id', id).select('id');
}
