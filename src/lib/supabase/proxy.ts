import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/database.types';
import { opcoesCookieSessao } from './cookies';

/** Renova a sessão a cada requisição e devolve se há usuário autenticado. */
export async function renovarSessao(
  request: NextRequest,
  headers: Headers,
): Promise<{ response: NextResponse; autenticado: boolean }> {
  let response = NextResponse.next({ request: { headers } });
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) {
    return { response, autenticado: false };
  }
  const supabase = createServerClient<Database>(url, chave, {
    cookieOptions: opcoesCookieSessao,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request: { headers } });
        for (const { name, value, options } of lista) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return { response, autenticado: Boolean(data.user) };
}
