'use server';

import { revalidatePath } from 'next/cache';
import { exigirEmpresa, podeLancar } from '@/features/acesso';
import { falha, falhaDeValidacao, mensagemDoBanco, sucesso, type Resultado } from '@/lib/erros';
import { salvarEntrada, salvarIndicador } from './repository';
import { esquemaCelula, esquemaIndicador } from './schema';

const SEM_PERMISSAO = 'Seu papel só permite consultar.';

/** Grava uma célula da grade (dia × forma). */
export async function salvarCelula(dados: {
  data: string;
  formaId: string;
  valor: string;
}): Promise<Resultado> {
  const contexto = await exigirEmpresa();
  const valido = esquemaCelula.safeParse(dados);
  if (!valido.success) return falhaDeValidacao(valido.error);
  if (!podeLancar(contexto.papel)) return falha(SEM_PERMISSAO);
  const { error } = await salvarEntrada(contexto.supabase, contexto.empresa.id, valido.data);
  if (error) return falha(mensagemDoBanco(error));
  revalidatePath('/empresa', 'layout');
  return sucesso();
}

export async function salvarIndicadoresDoDia(dados: {
  data: string;
  qtdVendas: string;
  qtdProdutos: string;
  descontos: string;
}): Promise<Resultado> {
  const contexto = await exigirEmpresa();
  const valido = esquemaIndicador.safeParse(dados);
  if (!valido.success) return falhaDeValidacao(valido.error);
  if (!podeLancar(contexto.papel)) return falha(SEM_PERMISSAO);
  const { error } = await salvarIndicador(contexto.supabase, contexto.empresa.id, valido.data);
  if (error) return falha(mensagemDoBanco(error));
  revalidatePath('/empresa', 'layout');
  return sucesso();
}
