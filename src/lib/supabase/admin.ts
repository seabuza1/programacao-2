import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { ambiente, chaveSecretaSupabase } from '@/lib/ambiente';
import type { Database } from '@/lib/database.types';
import type { ClienteSupabase } from './server';

/**
 * Ignora RLS. Uso restrito a operações de Auth que exigem a chave secreta (convite).
 * Toda permissão é conferida antes, com o cliente do usuário.
 */
export function criarClienteAdmin(): ClienteSupabase {
  return createClient<Database>(ambiente().supabaseUrl, chaveSecretaSupabase(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
