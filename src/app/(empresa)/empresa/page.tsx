import type { Metadata } from 'next';
import { EmConstrucao } from '@/app/_componentes/EmConstrucao';
import { exigirEmpresa } from '@/features/acesso';

export const metadata: Metadata = { title: 'Resumo do mês' };

export default async function Resumo() {
  await exigirEmpresa();
  return <EmConstrucao titulo="Resumo do mês" />;
}
