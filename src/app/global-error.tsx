'use client';

import { useEffect } from 'react';
import { registrarErroDoNavegador } from './_componentes/registrarErro';
import './globals.css';

/** Erro no layout raiz. Sem detalhes técnicos na tela. */
export default function ErroGlobal({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    void registrarErroDoNavegador({
      mensagem: error.message,
      digest: error.digest,
      rota: window.location.pathname,
    });
  }, [error]);
  return (
    <html lang="pt-BR">
      <body>
        <main className="publico">
          <div className="cartao pilha">
            <span className="marca">Gestão Fácil</span>
            <h1>Algo deu errado</h1>
            <p>O sistema está com um problema. Tente de novo em instantes.</p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- o layout raiz falhou: recarrega a página inteira */}
            <a href="/">Voltar ao início</a>
          </div>
        </main>
      </body>
    </html>
  );
}
