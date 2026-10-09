import 'server-only';
import type { Papel } from '@/features/acesso';
import { criarClienteAdmin } from '@/lib/supabase/admin';
import type { ClienteSupabase } from '@/lib/supabase/server';

/** Único ponto da regra "só admin_plataforma convida" (função pode_convidar no banco). */
export async function podeConvidar(supabase: ClienteSupabase, empresaId: string): Promise<boolean> {
  const { data } = await supabase.rpc('pode_convidar', { p_empresa_id: empresaId });
  return data === true;
}

/** Cria a conta e envia o convite. Conta já existente não é erro: só ganha o vínculo. */
export async function enviarConvite(email: string, redirectTo: string): Promise<string | null> {
  const { error } = await criarClienteAdmin().auth.admin.inviteUserByEmail(email, { redirectTo });
  if (!error || error.code === 'email_exists') {
    return null;
  }
  return error.code ?? 'desconhecido';
}

/** Feito com a sessão de quem convida: o banco confere a permissão de novo. */
export async function vincularPorEmail(
  supabase: ClienteSupabase,
  email: string,
  empresaId: string,
  papel: Papel,
) {
  return supabase.rpc('vincular_por_email', {
    p_email: email,
    p_empresa_id: empresaId,
    p_papel: papel,
  });
}
