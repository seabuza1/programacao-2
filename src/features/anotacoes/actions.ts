'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { exigirUsuario } from '@/features/acesso';
import { falha, falhaDeValidacao, mensagemDoBanco, sucesso, type Resultado } from '@/lib/erros';
import { campoId, campoMarcado } from '@/lib/validacao';
import { ehAdminDaEmpresa, inserirAnotacao } from './repository';

const esquema = z.object({
  empresaId: campoId,
  texto: z
    .string()
    .trim()
    .min(1, 'Escreva a anotação.')
    .max(4000, 'Use no máximo 4.000 caracteres.'),
  visivelParaEmpresa: campoMarcado,
});

/** Só admin escreve. Anotação não é editada nem apagada depois. */
export async function criarAnotacao(_: Resultado, formData: FormData): Promise<Resultado> {
  const { supabase } = await exigirUsuario();
  const dados = esquema.safeParse({
    empresaId: formData.get('empresaId'),
    texto: formData.get('texto'),
    visivelParaEmpresa: formData.get('visivelParaEmpresa'),
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  if (!(await ehAdminDaEmpresa(supabase, dados.data.empresaId))) {
    return falha('Só a administradora escreve anotações.');
  }
  const { empresaId, ...anotacao } = dados.data;
  const { error } = await inserirAnotacao(supabase, empresaId, anotacao);
  if (error) return falha(mensagemDoBanco(error));
  revalidatePath(`/admin/empresas/${empresaId}`);
  revalidatePath('/empresa');
  return sucesso('Anotação registrada.');
}
