import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { criarClienteAdmin } from '@/lib/supabase/admin';
import { buscarTodas } from '@/lib/supabase/paginar';
import type { ClienteSupabase } from '@/lib/supabase/server';
import { TABELAS_DA_EMPRESA, type TabelaDaEmpresa } from './service';

type Linha = Record<string, unknown>;

/**
 * Todos os dados da empresa, com a sessão de quem pede (o RLS vale).
 * Única leitura com todas as colunas: a portabilidade exige o registro completo.
 */
export async function lerDadosDaEmpresa(sb: ClienteSupabase, empresaId: string) {
  const livre = sb as unknown as SupabaseClient;
  const { data: empresa } = await livre.from('empresas').select('*').eq('id', empresaId).single();
  const tabelas: Partial<Record<TabelaDaEmpresa, Linha[]>> = {};
  for (const tabela of TABELAS_DA_EMPRESA) {
    tabelas[tabela] = await buscarTodas<Linha>((de, ate) =>
      livre.from(tabela).select('*').eq('empresa_id', empresaId).order('id').range(de, ate),
    );
  }
  const ids = [...new Set((tabelas.vinculos ?? []).map((v) => String(v.usuario_id)))];
  const { data: usuarios } = ids.length
    ? await sb.from('usuarios').select('id, nome, email, created_at').in('id', ids)
    : { data: [] };
  return { empresa: (empresa ?? {}) as Linha, usuarios: (usuarios ?? []) as Linha[], tabelas };
}

/** Exclui a empresa; devolve quem ficou sem vínculo nenhum. O banco confere a permissão. */
export async function excluirEmpresa(sb: ClienteSupabase, empresaId: string, confirmacao: string) {
  return sb.rpc('excluir_empresa', { p_empresa_id: empresaId, p_confirmacao: confirmacao });
}

/** Apaga as contas (dado pessoal) de quem não tem mais vínculo com nenhuma empresa. */
export async function apagarContas(ids: string[]): Promise<number> {
  const admin = criarClienteAdmin();
  let falhas = 0;
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) falhas += 1;
  }
  return falhas;
}
