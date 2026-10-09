import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { obterUsuarioParcial } from '@/features/acesso';
import { FormEntrar } from '@/features/autenticacao';

export const metadata: Metadata = { title: 'Entrar' };

export default async function Entrar() {
  if (await obterUsuarioParcial()) {
    redirect('/');
  }
  return (
    <>
      <h1>Entrar</h1>
      <FormEntrar />
    </>
  );
}
