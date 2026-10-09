import type { Metadata } from 'next';
import { EmConstrucao } from '@/app/_componentes/EmConstrucao';
import { exigirEmpresa, podeGerenciar } from '@/features/acesso';

export const metadata: Metadata = { title: 'Configurações' };

export default async function Configuracoes() {
  const { papel } = await exigirEmpresa();
  if (!podeGerenciar(papel)) {
    return (
      <p className="aviso aviso-erro">Só a administradora e o dono alteram as configurações.</p>
    );
  }
  return <EmConstrucao titulo="Configurações" />;
}
