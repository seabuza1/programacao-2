import 'server-only';
import type { ClienteSupabase } from '@/lib/supabase/server';

export interface FatorTotp {
  id: string;
  qrCode: string;
  segredo: string;
}

/** Devolve o código do erro (ou null se deu certo). */
export async function entrarComSenha(
  supabase: ClienteSupabase,
  email: string,
  senha: string,
  captchaToken: string | undefined,
): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  });
  return error ? (error.code ?? 'desconhecido') : null;
}

/** id do fator TOTP já confirmado, se houver. */
export async function fatorConfirmado(supabase: ClienteSupabase): Promise<string | null> {
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp.find((fator) => fator.status === 'verified')?.id ?? null;
}

/** Cadastra um novo autenticador, descartando cadastros anteriores não confirmados. */
export async function cadastrarFator(supabase: ClienteSupabase): Promise<FatorTotp | string> {
  const { data: fatores } = await supabase.auth.mfa.listFactors();
  for (const fator of fatores?.all ?? []) {
    if (fator.status !== 'verified') {
      await supabase.auth.mfa.unenroll({ factorId: fator.id });
    }
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Gestão Fácil',
  });
  if (error) {
    return error.code ?? 'desconhecido';
  }
  return { id: data.id, qrCode: data.totp.qr_code, segredo: data.totp.secret };
}

export async function verificarCodigo(
  supabase: ClienteSupabase,
  fatorId: string,
  codigo: string,
): Promise<string | null> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fatorId, code: codigo });
  return error ? (error.code ?? 'desconhecido') : null;
}

export async function sair(supabase: ClienteSupabase): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}

export async function pedirRedefinicao(
  supabase: ClienteSupabase,
  email: string,
  redirectTo: string,
  captchaToken: string | undefined,
): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
    ...(captchaToken ? { captchaToken } : {}),
  });
  return error ? (error.code ?? 'desconhecido') : null;
}

export async function confirmarLink(
  supabase: ClienteSupabase,
  tokenHash: string,
  tipo: 'invite' | 'recovery',
): Promise<string | null> {
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
  return error ? (error.code ?? 'desconhecido') : null;
}

export async function trocarSenha(
  supabase: ClienteSupabase,
  senha: string,
): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password: senha });
  return error ? (error.code ?? 'desconhecido') : null;
}
