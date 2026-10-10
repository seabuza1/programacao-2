import { NextResponse, type NextRequest } from 'next/server';
import { CABECALHOS_SEGURANCA, montarCsp, urlHttps } from '@/lib/seguranca';
import { renovarSessao } from '@/lib/supabase/proxy';

const PROTEGIDAS = ['/empresa', '/empresas', '/admin', '/definir-senha'];
const PRODUCAO = process.env.NODE_ENV === 'production';

function ehProtegida(caminho: string): boolean {
  return PROTEGIDAS.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`));
}

function comCabecalhos(response: NextResponse, csp: string): NextResponse {
  response.headers.set('Content-Security-Policy', csp);
  for (const { key, value } of CABECALHOS_SEGURANCA) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Força HTTPS, gera o nonce do CSP, renova a sessão e barra cedo quem não está logado.
 * As páginas conferem a permissão de novo.
 */
export async function proxy(request: NextRequest) {
  if (PRODUCAO) {
    const segura = urlHttps(request.nextUrl, request.headers.get('x-forwarded-proto'));
    if (segura) {
      return NextResponse.redirect(segura, 308);
    }
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = montarCsp({ nonce, desenvolvimento: !PRODUCAO });
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);

  const { response, autenticado } = await renovarSessao(request, headers);
  if (!autenticado && ehProtegida(request.nextUrl.pathname)) {
    return comCabecalhos(NextResponse.redirect(new URL('/entrar', request.url)), csp);
  }
  return comCabecalhos(response, csp);
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
