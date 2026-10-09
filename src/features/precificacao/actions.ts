'use server';

import { revalidatePath } from 'next/cache';
import { exigirEmpresa, podeGerenciar } from '@/features/acesso';
import { falha, falhaDeValidacao, mensagemDoBanco, sucesso, type Resultado } from '@/lib/erros';
import { excluirProduto, inserirProduto, salvarParametrosMarkup } from './repository';
import { esquemaExcluirProduto, esquemaMarkup, esquemaProduto } from './schema';

const SEM_PERMISSAO = 'Só a administradora e o dono alteram a precificação.';
const CAMINHO = '/empresa/precificacao';

export async function salvarMarkup(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirEmpresa();
  const dados = esquemaMarkup.safeParse({
    mes: formData.get('mes'),
    taxaCartao: formData.get('taxaCartao'),
    despesaFixa: formData.get('despesaFixa'),
    imposto: formData.get('imposto'),
    comissao: formData.get('comissao'),
    investimentos: formData.get('investimentos'),
    margemLucro: formData.get('margemLucro'),
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  if (!podeGerenciar(contexto.papel)) return falha(SEM_PERMISSAO);
  const { mes, ...percentuais } = dados.data;
  const { error } = await salvarParametrosMarkup(
    contexto.supabase,
    contexto.empresa.id,
    mes,
    percentuais,
  );
  if (error) return falha(mensagemDoBanco(error));
  revalidatePath(CAMINHO);
  return sucesso('Percentuais salvos.');
}

export async function adicionarProduto(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirEmpresa();
  const dados = esquemaProduto.safeParse({
    mes: formData.get('mes'),
    nome: formData.get('nome'),
    custo: formData.get('custo'),
    frete: formData.get('frete'),
    embalagem: formData.get('embalagem'),
    impostoEntrada: formData.get('impostoEntrada'),
    precoTrabalhado: formData.get('precoTrabalhado'),
    precoConcorrente: formData.get('precoConcorrente'),
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  if (!podeGerenciar(contexto.papel)) return falha(SEM_PERMISSAO);
  const { mes, ...produto } = dados.data;
  const { error } = await inserirProduto(contexto.supabase, contexto.empresa.id, mes, produto);
  if (error) return falha(mensagemDoBanco(error));
  revalidatePath(CAMINHO);
  return sucesso('Produto adicionado.');
}

export async function removerProduto(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirEmpresa();
  const dados = esquemaExcluirProduto.safeParse({ id: formData.get('id') });
  if (!dados.success) return falha('Pedido inválido.');
  if (!podeGerenciar(contexto.papel)) return falha(SEM_PERMISSAO);
  const { data, error } = await excluirProduto(
    contexto.supabase,
    contexto.empresa.id,
    dados.data.id,
  );
  if (error) return falha(mensagemDoBanco(error));
  if (data.length === 0) return falha('Produto não encontrado.');
  revalidatePath(CAMINHO);
  return sucesso('Produto removido.');
}
