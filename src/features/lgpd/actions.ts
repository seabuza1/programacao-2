'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { exigirAdminPlataforma, limparEmpresaAtiva } from '@/features/acesso';
import { falha, falhaDeValidacao, mensagemDoBanco, type Resultado } from '@/lib/erros';
import { apagarContas, excluirEmpresa } from './repository';

const esquema = z.object({
  empresaId: z.uuid(),
  confirmacao: z.string().trim().min(1, 'Digite o nome da empresa.').max(120),
});

export async function excluirEmpresaDefinitivamente(
  _: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const { supabase } = await exigirAdminPlataforma();
  const dados = esquema.safeParse({
    empresaId: formData.get('empresaId'),
    confirmacao: formData.get('confirmacao'),
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  // O banco confere: admin da plataforma, vínculo admin, segundo fator e nome exato.
  const { data: semVinculo, error } = await excluirEmpresa(
    supabase,
    dados.data.empresaId,
    dados.data.confirmacao,
  );
  if (error) return falha(mensagemDoBanco(error));
  const falhas = await apagarContas(semVinculo ?? []);
  await limparEmpresaAtiva();
  revalidatePath('/admin', 'layout');
  redirect(falhas > 0 ? '/admin/empresas?excluida=parcial' : '/admin/empresas?excluida=1');
}
