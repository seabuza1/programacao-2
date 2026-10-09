'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface ItemNavegacao {
  href: string;
  rotulo: string;
}

export function Navegacao({ itens, raiz }: { itens: ItemNavegacao[]; raiz: string }) {
  const caminho = usePathname();
  return (
    <nav className="nav" aria-label="Principal">
      {itens.map((item) => {
        const ativo =
          item.href === raiz
            ? caminho === raiz
            : caminho === item.href || caminho.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} aria-current={ativo ? 'page' : undefined}>
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
