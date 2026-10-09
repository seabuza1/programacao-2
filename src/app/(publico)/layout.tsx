import type { ReactNode } from 'react';

export default function LayoutPublico({ children }: { children: ReactNode }) {
  return (
    <main className="publico">
      <div className="cartao pilha">
        <span className="marca">Gestão Fácil</span>
        {children}
      </div>
    </main>
  );
}
