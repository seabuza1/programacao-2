'use server';

import { revalidatePath } from 'next/cache';
import { exigirAdminPlataforma } from '@/features/acesso';
import { ambiente } from '@/lib/ambiente';
import { dentroDoLimite, MENSAGEM_LIMITE } from '@/lib/limite';
import {
  ecoar,
  falha,
  falhaDeValidacao,
  mensagemDoBanco,
  sucesso,
  type Resultado,
} from '@/lib/erros';
import {
  alterarPapel,
  enviarConvite,
  podeConvidar,
  removerVinculo,
  vincularPorEmail,
} from './repository';
import { esquemaAlterarVinculo, esquemaConvite, esquemaRemoverVinculo } from './schema';

export async function convidarUsuario(
  _anterior: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const { supabase, usuario } = await exigirAdminPlataforma();
  const dados = esquemaConvite.safeParse({
    email: formData.get('email'),
    empresaId: formData.get('empresaId'),
    papel: formData.get('papel'),
  });
  const valores = ecoar(formData, ['email', 'empresaId', 'papel']);
  if (!dados.success) {
    return falhaDeValidacao(dados.error, valores);
  }
  const { email, empresaId, papel } = dados.data;
  if (!(await dentroDoLimite('convitePorUsuario', usuario.id))) {
    return falha(MENSAGEM_LIMITE, undefined, valores);
  }
  if (!(await podeConvidar(supabase, empresaId))) {
    return falha('Você não tem permissão para convidar para esta empresa.', undefined, valores);
  }
  const erroConvite = await enviarConvite(email, `${ambiente().siteUrl}/auth/confirmar`);
  if (erroConvite) {
    return falha('Não foi possível enviar o convite. Tente de novo.', undefined, valores);
  }
  const { error } = await vincularPorEmail(supabase, email, empresaId, papel);
  if (error) {
    return falha(
      error.code === '23505'
        ? 'Esse usuário já tem vínculo com a empresa.'
        : mensagemDoBanco(error),
      undefined,
      valores,
    );
  }
  revalidatePath('/admin/usuarios');
  return sucesso(`Convite enviado para ${email}.`);
}

/** Trocar papel e remover acesso: mesma checagem do convite, conferida no banco. */
export async function mudarPapel(_: Resultado, formData: FormData): Promise<Resultado> {
  const { supabase } = await exigirAdminPlataforma();
  const dados = esquemaAlterarVinculo.safeParse({
    vinculoId: formData.get('vinculoId'),
    papel: formData.get('papel'),
  });
  if (!dados.success) return falha('Pedido inválido.');
  const { error } = await alterarPapel(supabase, dados.data.vinculoId, dados.data.papel);
  if (error) return falha(mensagemDoBanco(error));
  revalidatePath('/admin', 'layout');
  return sucesso('Papel alterado.');
}

export async function removerAcesso(_: Resultado, formData: FormData): Promise<Resultado> {
  const { supabase } = await exigirAdminPlataforma();
  const dados = esquemaRemoverVinculo.safeParse({ vinculoId: formData.get('vinculoId') });
  if (!dados.success) return falha('Pedido inválido.');
  const { error } = await removerVinculo(supabase, dados.data.vinculoId);
  if (error) return falha(mensagemDoBanco(error));
  revalidatePath('/admin', 'layout');
  return sucesso('Acesso removido.');
}
