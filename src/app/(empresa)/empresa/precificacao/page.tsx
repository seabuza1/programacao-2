import type { Metadata } from 'next';
import { EmConstrucao } from '@/app/_componentes/EmConstrucao';
import { exigirEmpresa } from '@/features/acesso';

export const metadata: Metadata = { title: 'Precificação' };

export default async function Precificacao() {
  await exigirEmpresa();
  return <EmConstrucao titulo="Precificação" />;
}
