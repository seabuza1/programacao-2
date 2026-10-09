'use server';

import { revalidatePath } from 'next/cache';
import { exigirEmpresa, podeLancar } from '@/features/acesso';
import { falha, falhaDeValidacao, mensagemDoBanco, sucesso, type Resultado } from '@/lib/erros';
import { excluirMovimentacao, inserirMovimentacao } from './repository';
import { esquemaExclusao, esquemaMovimentacao } from './schema';

const SEM_PERMISSAO = 'Seu papel só permite consultar.';

export async function lancarMovimentacao(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirEmpresa();
  const dados = esquemaMovimentacao.safeParse({
    data: formData.get('data'),
    tipo: formData.get('tipo'),
    caixa: formData.get('caixa'),
    valor: formData.get('valor'),
    contaId: formData.get('contaId') ?? undefined,
    origem: formData.get('origem') ?? undefined,
    descricao: formData.get('descricao') ?? '',
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  if (!podeLancar(contexto.papel)) return falha(SEM_PERMISSAO);
  const { error } = await inserirMovimentacao(contexto.supabase, contexto.empresa.id, dados.data);
  if (error) return falha(error.code === '23503' ? 'Conta inválida.' : mensagemDoBanco(error));
  revalidatePath('/empresa', 'layout');
  return sucesso('Lançamento registrado.');
}

export async function removerMovimentacao(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirEmpresa();
  const dados = esquemaExclusao.safeParse({ id: formData.get('id') });
  if (!dados.success) return falha('Pedido inválido.');
  if (!podeLancar(contexto.papel)) return falha(SEM_PERMISSAO);
  const { data, error } = await excluirMovimentacao(
    contexto.supabase,
    contexto.empresa.id,
    dados.data.id,
  );
  if (error) return falha(mensagemDoBanco(error));
  if (data.length === 0) return falha('Lançamento não encontrado.');
  revalidatePath('/empresa', 'layout');
  return sucesso('Lançamento excluído.');
}
