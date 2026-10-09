import type { Metadata } from 'next';
import { EmConstrucao } from '@/app/_componentes/EmConstrucao';
import { exigirEmpresa } from '@/features/acesso';

export const metadata: Metadata = { title: 'Relatórios' };

export default async function Relatorios() {
  await exigirEmpresa();
  return <EmConstrucao titulo="Relatórios" />;
}
