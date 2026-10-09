import 'server-only';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { ambiente } from '@/lib/ambiente';
import type { Database } from '@/lib/database.types';
import { opcoesCookieSessao } from './cookies';

export type ClienteSupabase = SupabaseClient<Database>;

/** Cliente com a sessão do usuário da requisição. RLS sempre vale. */
export async function criarClienteServidor(): Promise<ClienteSupabase> {
  const { supabaseUrl, supabasePublishableKey } = ambiente();
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookieOptions: opcoesCookieSessao,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component não grava cookie. O proxy renova a sessão.
        }
      },
    },
  });
}
