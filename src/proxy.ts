import { NextResponse, type NextRequest } from 'next/server';
import { renovarSessao } from '@/lib/supabase/proxy';

const PROTEGIDAS = ['/empresa', '/empresas', '/admin', '/definir-senha'];

function ehProtegida(caminho: string): boolean {
  return PROTEGIDAS.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`));
}

/** Renova a sessão e barra cedo quem não está logado. As páginas conferem de novo. */
export async function proxy(request: NextRequest) {
  const { response, autenticado } = await renovarSessao(request, new Headers(request.headers));
  if (!autenticado && ehProtegida(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/entrar', request.url));
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
