import 'server-only';
import type { ClienteSupabase } from '@/lib/supabase/server';
import type { NivelSessao, Papel } from './service';

export interface UsuarioAtual {
  id: string;
  email: string;
  nome: string;
  adminPlataforma: boolean;
}

/** Usuário validado no servidor de Auth (não confia só no cookie). */
export async function lerUsuarioAtual(supabase: ClienteSupabase): Promise<UsuarioAtual | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return null;
  }
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nome, admin_plataforma')
    .eq('id', data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    nome: perfil?.nome ?? '',
    adminPlataforma: perfil?.admin_plataforma ?? false,
  };
}

export async function lerNivelSessao(supabase: ClienteSupabase): Promise<NivelSessao> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const nivel = data?.currentLevel;
  if (nivel === 'aal2') {
    return 'aal2';
  }
  return nivel === 'aal1' ? 'aal1' : null;
}

export async function lerPrecisaMfa(supabase: ClienteSupabase): Promise<boolean> {
  const { data, error } = await supabase.rpc('precisa_mfa');
  // Na dúvida, exige.
  return error ? true : Boolean(data);
}

export interface EmpresaDoUsuario {
  id: string;
  nome: string;
  papel: Papel;
}

export async function listarEmpresasDoUsuario(
  supabase: ClienteSupabase,
  usuarioId: string,
): Promise<EmpresaDoUsuario[]> {
  const { data } = await supabase
    .from('vinculos')
    .select('papel, empresas(id, nome)')
    .eq('usuario_id', usuarioId);
  return (data ?? [])
    .flatMap((v) =>
      v.empresas ? [{ id: v.empresas.id, nome: v.empresas.nome, papel: v.papel }] : [],
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function temAcesso(supabase: ClienteSupabase, empresaId: string): Promise<boolean> {
  const { data } = await supabase.rpc('tem_acesso', { p_empresa_id: empresaId });
  return data === true;
}
