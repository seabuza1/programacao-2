import Link from 'next/link';
import type { ReactNode } from 'react';

export default function LayoutPublico({ children }: { children: ReactNode }) {
  return (
    <main className="publico">
      <div className="cartao pilha">
        <span className="marca">Gestão Fácil</span>
        {children}
        <footer
          className="linha suave pequeno"
          style={{ borderTop: '1px solid var(--borda)', paddingTop: 12 }}
        >
          <Link href="/termos">Termos de uso</Link>
          <Link href="/privacidade">Privacidade</Link>
        </footer>
      </div>
    </main>
  );
}
