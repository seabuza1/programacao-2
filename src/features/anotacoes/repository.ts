import 'server-only';
import type { ClienteSupabase } from '@/lib/supabase/server';

export interface Anotacao {
  id: string;
  texto: string;
  visivelParaEmpresa: boolean;
  criadaEm: string;
  autor: string;
}

/** O RLS já filtra: a empresa só recebe as visíveis; a admin recebe todas. */
export async function listarAnotacoes(sb: ClienteSupabase, empresaId: string): Promise<Anotacao[]> {
  const { data, error } = await sb
    .from('anotacoes')
    .select('id, texto, visivel_para_empresa, created_at, created_by')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error('Falha ao ler as anotações.');
  const autores = [...new Set(data.map((a) => a.created_by).filter((id): id is string => !!id))];
  const { data: usuarios } = autores.length
    ? await sb.from('usuarios').select('id, nome, email').in('id', autores)
    : { data: [] };
  const nomes = new Map((usuarios ?? []).map((u) => [u.id, u.nome || u.email]));
  return data.map((a) => ({
    id: a.id,
    texto: a.texto,
    visivelParaEmpresa: a.visivel_para_empresa,
    criadaEm: a.created_at,
    autor: (a.created_by && nomes.get(a.created_by)) || 'Administradora',
  }));
}

export function inserirAnotacao(
  sb: ClienteSupabase,
  empresaId: string,
  anotacao: { texto: string; visivelParaEmpresa: boolean },
) {
  return sb.from('anotacoes').insert({
    empresa_id: empresaId,
    texto: anotacao.texto,
    visivel_para_empresa: anotacao.visivelParaEmpresa,
  });
}

export async function ehAdminDaEmpresa(sb: ClienteSupabase, empresaId: string): Promise<boolean> {
  const { data } = await sb.rpc('tem_papel', { p_empresa_id: empresaId, p_papeis: ['admin'] });
  return data === true;
}
