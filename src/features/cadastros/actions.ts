'use server';

import { revalidatePath } from 'next/cache';
import { exigirEmpresa, podeGerenciar } from '@/features/acesso';
import { falha, falhaDeValidacao, mensagemDoBanco, sucesso, type Resultado } from '@/lib/erros';
import {
  atualizarConta,
  atualizarForma,
  inserirConta,
  inserirForma,
  salvarParametros,
  salvarSaldosIniciais,
} from './repository';
import {
  esquemaAtivar,
  esquemaNovaConta,
  esquemaNovaForma,
  esquemaParametros,
  esquemaRenomear,
  esquemaSaldosIniciais,
} from './schema';

const SEM_PERMISSAO = 'Só a administradora e o dono alteram as configurações.';
const CAMINHO = '/empresa/configuracoes';

/** Autentica e confere o papel: admin e dono gerenciam cadastros. */
async function exigirGestao() {
  const contexto = await exigirEmpresa();
  return podeGerenciar(contexto.papel) ? contexto : null;
}

function concluir(error: { code?: string; message?: string } | null, mensagem: string): Resultado {
  if (error) {
    return falha(
      error.code === '23505' ? 'Já existe um item com esse nome.' : mensagemDoBanco(error),
    );
  }
  revalidatePath(CAMINHO);
  return sucesso(mensagem);
}

export async function criarForma(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirGestao();
  if (!contexto) return falha(SEM_PERMISSAO);
  const dados = esquemaNovaForma.safeParse({
    nome: formData.get('nome'),
    destino: formData.get('destino'),
    contaFaturamento: formData.get('contaFaturamento'),
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  const { error } = await inserirForma(contexto.supabase, contexto.empresa.id, dados.data);
  return concluir(error, 'Forma de recebimento criada.');
}

export async function criarConta(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirGestao();
  if (!contexto) return falha(SEM_PERMISSAO);
  const dados = esquemaNovaConta.safeParse({
    nome: formData.get('nome'),
    grupo: formData.get('grupo'),
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  const { error } = await inserirConta(contexto.supabase, contexto.empresa.id, dados.data);
  return concluir(error, 'Conta criada.');
}

type Contexto = NonNullable<Awaited<ReturnType<typeof exigirGestao>>>;

async function alterarItem(
  contexto: Contexto,
  tipo: 'forma' | 'conta',
  id: string,
  campos: { nome?: string; ativa?: boolean },
): Promise<Resultado> {
  const atualizar = tipo === 'forma' ? atualizarForma : atualizarConta;
  const { data, error } = await atualizar(contexto.supabase, contexto.empresa.id, id, campos);
  if (!error && data?.length === 0) return falha('Item não encontrado.');
  return concluir(error, 'Alteração salva.');
}

export async function renomearItem(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirGestao();
  if (!contexto) return falha(SEM_PERMISSAO);
  const dados = esquemaRenomear.safeParse({ id: formData.get('id'), nome: formData.get('nome') });
  if (!dados.success) return falhaDeValidacao(dados.error);
  const tipo = formData.get('tipo') === 'conta' ? 'conta' : 'forma';
  return alterarItem(contexto, tipo, dados.data.id, { nome: dados.data.nome });
}

export async function ativarItem(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirGestao();
  if (!contexto) return falha(SEM_PERMISSAO);
  const dados = esquemaAtivar.safeParse({ id: formData.get('id'), ativa: formData.get('ativa') });
  if (!dados.success) return falha('Pedido inválido.');
  const tipo = formData.get('tipo') === 'conta' ? 'conta' : 'forma';
  return alterarItem(contexto, tipo, dados.data.id, { ativa: dados.data.ativa });
}

export async function salvarParametrosDoMes(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirGestao();
  if (!contexto) return falha(SEM_PERMISSAO);
  const dados = esquemaParametros.safeParse({
    mes: formData.get('mes'),
    diasPrevistos: formData.get('diasPrevistos'),
    meta: formData.get('meta'),
    taxaDebito: formData.get('taxaDebito'),
    taxaCredito: formData.get('taxaCredito'),
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  const { mes, ...parametros } = dados.data;
  const { error } = await salvarParametros(contexto.supabase, contexto.empresa.id, mes, parametros);
  if (!error) revalidatePath('/empresa', 'layout');
  return concluir(error, 'Parâmetros do mês salvos.');
}

export async function salvarSaldos(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirGestao();
  if (!contexto) return falha(SEM_PERMISSAO);
  const dados = esquemaSaldosIniciais.safeParse({
    mesInicio: formData.get('mesInicio'),
    dinheiro: formData.get('dinheiro'),
    banco: formData.get('banco'),
  });
  if (!dados.success) return falhaDeValidacao(dados.error);
  const { error } = await salvarSaldosIniciais(contexto.supabase, contexto.empresa.id, dados.data);
  if (!error) revalidatePath('/empresa', 'layout');
  return concluir(error, 'Saldos iniciais salvos.');
}
