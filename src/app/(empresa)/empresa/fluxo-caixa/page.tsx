import type { Metadata } from 'next';
import { EmConstrucao } from '@/app/_componentes/EmConstrucao';
import { exigirEmpresa } from '@/features/acesso';

export const metadata: Metadata = { title: 'Fluxo de caixa' };

export default async function FluxoCaixa() {
  await exigirEmpresa();
  return <EmConstrucao titulo="Fluxo de caixa" />;
}
