'use client';

import Link from 'next/link';

/** Erro inesperado numa página. Sem detalhes técnicos na tela (o registro vai para o monitor). */
export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="publico">
      <div className="cartao pilha">
        <span className="marca">Gestão Fácil</span>
        <h1>Algo deu errado</h1>
        <p>Não foi possível carregar esta página. Tente de novo em instantes.</p>
        <button type="button" className="botao botao-primario" onClick={reset}>
          Tentar de novo
        </button>
        <Link href="/">Voltar ao início</Link>
      </div>
    </main>
  );
}
