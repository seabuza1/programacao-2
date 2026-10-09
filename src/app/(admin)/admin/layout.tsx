import Link from 'next/link';
import type { ReactNode } from 'react';
import { BotaoSair } from '@/app/_componentes/BotaoSair';
import { Navegacao } from '@/app/_componentes/Navegacao';
import { exigirAdminPlataforma } from '@/features/acesso';

const ITENS = [
  { href: '/admin', rotulo: 'Painel' },
  { href: '/admin/empresas', rotulo: 'Empresas' },
  { href: '/admin/usuarios', rotulo: 'Usuários' },
];

export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  const { usuario } = await exigirAdminPlataforma();
  return (
    <>
      <header className="cabecalho">
        <div className="cabecalho-linha">
          <Link href="/admin" className="marca">
            Gestão Fácil
          </Link>
          <span className="selo selo-ok">Administradora</span>
          <span className="espaco" />
          <span className="suave pequeno">{usuario.email}</span>
          <Link href="/empresas">Área da empresa</Link>
          <BotaoSair />
        </div>
        <Navegacao itens={ITENS} raiz="/admin" />
      </header>
      <main className="conteudo">{children}</main>
    </>
  );
}
