import type { Metadata } from 'next';
import { EmConstrucao } from '@/app/_componentes/EmConstrucao';
import { exigirAdminPlataforma } from '@/features/acesso';

export const metadata: Metadata = { title: 'Empresas' };

export default async function Empresas() {
  await exigirAdminPlataforma();
  return <EmConstrucao titulo="Empresas" />;
}
