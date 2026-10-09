import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { inject } from 'vitest';
import type { Database } from '@/lib/database.types';
import { codigoTotp } from './totp';

export type Cliente = SupabaseClient<Database>;
export type Papel = Database['public']['Enums']['papel'];

export const SENHA_TESTE = 'Senha-de-teste-2026';

const opcoes = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

/** Ignora RLS. Só para montar e conferir cenários. */
export function clienteServico(): Cliente {
  const { url, secretKey } = inject('supabase');
  return createClient<Database>(url, secretKey, opcoes);
}

export function clienteAnonimo(): Cliente {
  const { url, publishableKey } = inject('supabase');
  return createClient<Database>(url, publishableKey, opcoes);
}

export interface Usuario {
  id: string;
  email: string;
}

export async function criarUsuario(prefixo: string, adminPlataforma = false): Promise<Usuario> {
  const servico = clienteServico();
  const email = `${prefixo}-${randomUUID().slice(0, 8)}@teste.test`;
  const { data, error } = await servico.auth.admin.createUser({
    email,
    password: SENHA_TESTE,
    email_confirm: true,
  });
  if (error) throw error;
  if (adminPlataforma) {
    const { error: erro } = await servico
      .from('usuarios')
      .update({ admin_plataforma: true })
      .eq('id', data.user.id);
    if (erro) throw erro;
  }
  return { id: data.user.id, email };
}

const fatores = new Map<string, { id: string; segredo: string }>();

async function confirmarSegundoFator(cliente: Cliente, email: string): Promise<void> {
  let fator = fatores.get(email);
  if (!fator) {
    const { data, error } = await cliente.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw error;
    fator = { id: data.id, segredo: data.totp.secret };
    fatores.set(email, fator);
  }
  const { error } = await cliente.auth.mfa.challengeAndVerify({
    factorId: fator.id,
    code: codigoTotp(fator.segredo),
  });
  if (error) throw error;
}

/** Entra com e-mail e senha. Com `mfa`, confirma o segundo fator (sessão aal2). */
export async function entrar(email: string, { mfa = false } = {}): Promise<Cliente> {
  const cliente = clienteAnonimo();
  const { error } = await cliente.auth.signInWithPassword({ email, password: SENHA_TESTE });
  if (error) throw error;
  if (mfa) {
    await confirmarSegundoFator(cliente, email);
  }
  return cliente;
}
