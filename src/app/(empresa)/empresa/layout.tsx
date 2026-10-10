import Link from 'next/link';
import type { ReactNode } from 'react';
import { BotaoSair } from '@/app/_componentes/BotaoSair';
import { Navegacao } from '@/app/_componentes/Navegacao';
import { NOME_DO_PAPEL, exigirEmpresa } from '@/features/acesso';

const ITENS = [
  { href: '/empresa', rotulo: 'Resumo' },
  { href: '/empresa/caixa-diario', rotulo: 'Caixa diário' },
  { href: '/empresa/fluxo-caixa', rotulo: 'Fluxo de caixa' },
  { href: '/empresa/relatorios', rotulo: 'Relatórios' },
  { href: '/empresa/precificacao', rotulo: 'Precificação' },
  { href: '/empresa/configuracoes', rotulo: 'Configurações' },
];

export default async function LayoutEmpresa({ children }: { children: ReactNode }) {
  const { empresa, empresas, papel, usuario } = await exigirEmpresa();
  return (
    <>
      <header className="cabecalho">
        <div className="cabecalho-linha">
          <Link href="/empresa" className="marca">
            Gestão Fácil
          </Link>
          <strong>{empresa.nome}</strong>
          <span className="selo">{NOME_DO_PAPEL[papel]}</span>
          {empresas.length > 1 && <Link href="/empresas">Trocar empresa</Link>}
          <span className="espaco" />
          {usuario.adminPlataforma && <Link href="/admin">Painel da administradora</Link>}
          <BotaoSair />
        </div>
        <Navegacao itens={ITENS} raiz="/empresa" />
      </header>
      <main className="conteudo">{children}</main>
    </>
  );
}
