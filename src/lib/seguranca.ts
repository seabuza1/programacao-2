/** Origem do Cloudflare Turnstile (proteção contra robô no login). */
export const ORIGEM_TURNSTILE = 'https://challenges.cloudflare.com';

/**
 * Content-Security-Policy com nonce por requisição.
 * Em desenvolvimento o React precisa de 'unsafe-eval' e de estilos sem nonce.
 */
export function montarCsp({ nonce, desenvolvimento }: { nonce: string; desenvolvimento: boolean }) {
  const diretivas = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${desenvolvimento ? " 'unsafe-eval'" : ''}`,
    desenvolvimento ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    // Atributos style="" dos componentes.
    "style-src-attr 'unsafe-inline'",
    // QR code do segundo fator vem em data: URI.
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${ORIGEM_TURNSTILE}`,
    `frame-src ${ORIGEM_TURNSTILE}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(desenvolvimento ? [] : ['upgrade-insecure-requests']),
  ];
  return diretivas.join('; ');
}

/** Cabeçalhos fixos de segurança, aplicados a todas as respostas. */
export const CABECALHOS_SEGURANCA: { key: string; value: string }[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

/** Em produção, só HTTPS: devolve a URL https se a requisição chegou por http. */
export function urlHttps(url: URL, protocoloEncaminhado: string | null): URL | null {
  // Máquina local (next start sem TLS) fica de fora.
  if (protocoloEncaminhado !== 'http' || ['localhost', '127.0.0.1'].includes(url.hostname)) {
    return null;
  }
  const segura = new URL(url);
  segura.protocol = 'https:';
  return segura;
}
