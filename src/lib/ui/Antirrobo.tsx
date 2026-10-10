'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

/**
 * Desafio do Cloudflare Turnstile. O script (com nonce) é carregado pela página.
 * O token vale uma vez: a cada novo resultado do formulário, o desafio recomeça.
 */
export function DesafioTurnstile({ chave, versao }: { chave: string; versao: unknown }) {
  useEffect(() => {
    window.turnstile?.reset();
  }, [versao]);
  return <div className="cf-turnstile" data-sitekey={chave} data-language="pt-br" />;
}

/** Campo invisível: pessoas não preenchem, robôs costumam preencher. */
export function CampoArmadilha() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
    >
      <label htmlFor="site">Não preencha</label>
      <input id="site" name="site" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
