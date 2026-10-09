import { headers } from 'next/headers';
import Script from 'next/script';
import { ORIGEM_TURNSTILE } from '@/lib/seguranca';

/** Carrega o script do Turnstile com o nonce do CSP desta requisição. */
export async function ScriptTurnstile() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <Script
      src={`${ORIGEM_TURNSTILE}/turnstile/v0/api.js`}
      nonce={nonce}
      strategy="afterInteractive"
    />
  );
}
