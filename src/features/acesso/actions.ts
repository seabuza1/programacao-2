'use server';

import { redirect } from 'next/navigation';
import { definirEmpresaAtiva } from './sessao';

export async function escolherEmpresa(formData: FormData): Promise<void> {
  if (!(await definirEmpresaAtiva(formData.get('empresaId')))) {
    redirect('/empresas');
  }
  redirect('/empresa');
}
