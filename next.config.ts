import type { NextConfig } from 'next';
import { CABECALHOS_SEGURANCA } from './src/lib/seguranca';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Cabeçalhos fixos também nas rotas que o proxy não intercepta (arquivos estáticos).
  // O CSP, com nonce por requisição, vem do proxy (src/proxy.ts).
  headers: async () => [{ source: '/:path*', headers: CABECALHOS_SEGURANCA }],
};

export default nextConfig;
