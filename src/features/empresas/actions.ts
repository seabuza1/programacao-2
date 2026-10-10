'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { exigirAdminPlataforma, exigirUsuario } from '@/features/acesso';
import { falha, falhaDeValidacao, mensagemDoBanco, sucesso, type Resultado } from '@/lib/erros';
import { campoId, campoTexto } from '@/lib/validacao';
import { atualizarEmpresa, criarEmpresa } from './repository';

const setor = z
  .enum(['', 'servicos', 'comercio', 'industria'])
  .transform((valor) => (valor === '' ? null : valor));

const esquemaNova = z.object({ nome: campoTexto(120, 'Informe o nome da empresa.'), setor });
const esquemaEdicao = esquemaNova.extend({ id: campoId });

export async function novaEmpresa(_: Resultado, formData: FormData): Promise<Resultado> {
  const { supabase } = await exigirAdminPlataforma();
  const dados = esquemaNova.safeParse({
    nome: formData.get('nome'),
    setor: formData.get('setor') ?? '',
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  // O banco confere de novo: só admin_plataforma com segundo fator cria empresa.
  const { data: id, error } = await criarEmpresa(supabase, dados.data.nome);
  if (error || !id) return falha(error ? mensagemDoBanco(error) : 'Não foi possível criar.');
  if (dados.data.setor) {
    await atualizarEmpresa(supabase, id, dados.data);
  }
  revalidatePath('/admin', 'layout');
  redirect(`/admin/empresas/${id}`);
}

export async function editarEmpresa(_: Resultado, formData: FormData): Promise<Resultado> {
  const { supabase } = await exigirUsuario();
  const dados = esquemaEdicao.safeParse({
    id: formData.get('id'),
    nome: formData.get('nome'),
    setor: formData.get('setor') ?? '',
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  // RLS: só admin e dono da empresa alteram.
  const { id, ...campos } = dados.data;
  const { data, error } = await atualizarEmpresa(supabase, id, campos);
  if (error) return falha(mensagemDoBanco(error));
  if (data.length === 0) return falha('Você não tem permissão para alterar esta empresa.');
  revalidatePath('/admin', 'layout');
  revalidatePath('/empresa', 'layout');
  return sucesso('Empresa atualizada.');
}
