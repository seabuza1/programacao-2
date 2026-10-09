import type { Metadata } from 'next';
import { EmConstrucao } from '@/app/_componentes/EmConstrucao';
import { exigirAdminPlataforma } from '@/features/acesso';

export const metadata: Metadata = { title: 'Painel' };

export default async function Painel() {
  await exigirAdminPlataforma();
  return <EmConstrucao titulo="Painel" />;
}
