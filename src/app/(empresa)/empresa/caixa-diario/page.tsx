import type { Metadata } from 'next';
import { EmConstrucao } from '@/app/_componentes/EmConstrucao';
import { exigirEmpresa } from '@/features/acesso';

export const metadata: Metadata = { title: 'Caixa diário' };

export default async function CaixaDiario() {
  await exigirEmpresa();
  return <EmConstrucao titulo="Caixa diário" />;
}
